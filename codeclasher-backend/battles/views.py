from django.utils import timezone
from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
import random, subprocess, tempfile, os, time

from .models import Battle, Submission, MatchQueue, BattleStatus, BattleMode
from .serializers import BattleSerializer, BattleListSerializer, SubmissionSerializer
from problems.models import Problem
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


def broadcast_battle_update(room_code: str, event_type: str, data: dict):
    """Send WebSocket update to battle room"""
    channel_layer = get_channel_layer()
    try:
        async_to_sync(channel_layer.group_send)(
            f'battle_{room_code}',
            {'type': 'battle_update', 'event': event_type, 'data': data}
        )
    except Exception:
        pass  # Channel layer might not be connected


def judge_submission(code: str, language: str, problem: Problem) -> dict:
    """Simple Python judge — extend for multi-language support"""
    if language != 'python':
        return {
            'verdict': Submission.Verdict.COMPILATION_ERROR,
            'error_msg': f'Language "{language}" not supported yet. Use Python.',
            'test_cases_passed': 0,
            'test_cases_total': len(problem.test_cases),
            'runtime_ms': 0,
        }

    test_cases = problem.test_cases
    passed = 0
    total  = len(test_cases)
    last_error = ''

    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write(code)
        fname = f.name

    try:
        for tc in test_cases:
            try:
                t0 = time.time()
                proc = subprocess.run(
                    ['python3', fname],
                    input=tc.get('input', ''),
                    capture_output=True, text=True,
                    timeout=max(problem.time_limit_ms / 1000, 5),
                )
                elapsed_ms = int((time.time() - t0) * 1000)
                if proc.returncode != 0:
                    last_error = proc.stderr[:500]
                    return {
                        'verdict': Submission.Verdict.RUNTIME_ERROR,
                        'error_msg': last_error,
                        'test_cases_passed': passed,
                        'test_cases_total': total,
                        'runtime_ms': elapsed_ms,
                    }
                actual   = proc.stdout.strip()
                expected = tc.get('output', '').strip()
                if actual == expected:
                    passed += 1
                else:
                    return {
                        'verdict': Submission.Verdict.WRONG_ANSWER,
                        'error_msg': f'Expected: {expected[:100]}\nGot: {actual[:100]}',
                        'test_cases_passed': passed,
                        'test_cases_total': total,
                        'runtime_ms': elapsed_ms,
                    }
            except subprocess.TimeoutExpired:
                return {
                    'verdict': Submission.Verdict.TIME_LIMIT,
                    'error_msg': 'Time Limit Exceeded',
                    'test_cases_passed': passed,
                    'test_cases_total': total,
                    'runtime_ms': problem.time_limit_ms,
                }
    finally:
        os.unlink(fname)

    return {
        'verdict': Submission.Verdict.ACCEPTED,
        'test_cases_passed': passed,
        'test_cases_total': total,
        'runtime_ms': 0,
        'error_msg': '',
    }


class BattleViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Battle.objects.select_related(
            'player1', 'player2', 'winner', 'problem'
        ).prefetch_related('submissions__user')

    def get_serializer_class(self):
        if self.action == 'list':
            return BattleListSerializer
        return BattleSerializer

    def get_queryset(self):
        qs = Battle.objects.select_related('player1', 'player2', 'winner', 'problem')
        user = self.request.user
        return qs.filter(
            models.Q(player1=user) | models.Q(player2=user)
        ) if hasattr(self, 'action') and self.action == 'list' else qs

    # ─── Matchmaking ──────────────────────────────────────────────────────────

    @action(detail=False, methods=['post'], url_path='queue/join')
    def join_queue(self, request):
        user = request.user
        mode = request.data.get('mode', BattleMode.RANKED)

        # Remove existing queue entry
        MatchQueue.objects.filter(user=user).delete()

        # Try to find a match
        match = self._find_match(user, mode)
        if match:
            return Response(BattleSerializer(match).data, status=status.HTTP_201_CREATED)

        # Add to queue
        entry = MatchQueue.objects.create(
            user=user, mode=mode, rating=user.profile.rating
        )
        return Response({'status': 'queued', 'message': 'Searching for opponent...'})

    @action(detail=False, methods=['post'], url_path='queue/leave')
    def leave_queue(self, request):
        MatchQueue.objects.filter(user=request.user).delete()
        return Response({'status': 'left', 'message': 'Left the queue.'})

    @action(detail=False, methods=['get'], url_path='queue/status')
    def queue_status(self, request):
        from django.db import models as dj_models
        entry = MatchQueue.objects.filter(user=request.user).first()
        if not entry:
            recent_battle = Battle.objects.filter(
                dj_models.Q(player1=request.user) | dj_models.Q(player2=request.user),
                status__in=[BattleStatus.WAITING, BattleStatus.IN_PROGRESS],
            ).order_by("-created_at").first()
            if recent_battle:
                return Response({"in_queue": False, "matched": True, "room_code": recent_battle.room_code})
            return Response({"in_queue": False, "matched": False})
        return Response({"in_queue": True, "mode": entry.mode, "since": entry.joined_at})

    def _find_match(self, user, mode):
        """Find a suitable opponent from the queue"""
        rating = user.profile.rating
        rating_range = 300  # ±300 rating

        opponent_entry = MatchQueue.objects.filter(
            mode=mode,
            rating__gte=rating - rating_range,
            rating__lte=rating + rating_range,
        ).exclude(user=user).order_by('joined_at').first()

        if not opponent_entry:
            return None

        opponent = opponent_entry.user
        opponent_entry.delete()

        # Pick a random problem appropriate for both ratings
        problem = self._pick_problem(rating, opponent.profile.rating, mode)

        with transaction.atomic():
            battle = Battle.objects.create(
                mode=mode,
                player1=user,
                player2=opponent,
                problem=problem,
            )
            battle.start()

        broadcast_battle_update(battle.room_code, 'match_found', {
            'room_code': battle.room_code,
            'problem': problem.slug if problem else None,
        })
        return battle

    def _pick_problem(self, r1: int, r2: int, mode: str) -> Problem:
        avg_rating = (r1 + r2) / 2
        if avg_rating < 500:
            difficulties = ['EASY']
        elif avg_rating < 1500:
            difficulties = ['EASY', 'MEDIUM']
        elif avg_rating < 3000:
            difficulties = ['MEDIUM', 'HARD']
        else:
            difficulties = ['HARD', 'ELITE']

        qs = Problem.objects.filter(difficulty__in=difficulties)
        return random.choice(list(qs)) if qs.exists() else Problem.objects.order_by('?').first()

    # ─── Custom rooms ─────────────────────────────────────────────────────────

    @action(detail=False, methods=['post'], url_path='create-room')
    def create_room(self, request):
        mode = request.data.get('mode', BattleMode.CASUAL)
        problem_id = request.data.get('problem_id')
        problem = Problem.objects.filter(id=problem_id).first() if problem_id else None

        battle = Battle.objects.create(
            mode=mode,
            player1=request.user,
            problem=problem,
        )
        return Response(BattleSerializer(battle).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='join-room')
    def join_room(self, request):
        room_code = request.data.get('room_code', '').upper()
        battle = Battle.objects.filter(
            room_code=room_code, status=BattleStatus.WAITING
        ).first()

        if not battle:
            return Response({'error': 'Room not found or already started.'}, status=404)
        if battle.player1 == request.user:
            return Response({'error': 'You created this room.'}, status=400)

        battle.player2 = request.user
        if not battle.problem:
            battle.problem = self._pick_problem(
                battle.player1.profile.rating,
                request.user.profile.rating,
                battle.mode
            )
        battle.start()

        broadcast_battle_update(battle.room_code, 'player_joined', {
            'player2': request.user.username
        })
        return Response(BattleSerializer(battle).data)

    # ─── Battle room ─────────────────────────────────────────────────────────

    @action(detail=False, methods=['get'], url_path='room/(?P<room_code>[A-Z0-9]+)')
    def get_room(self, request, room_code=None):
        battle = Battle.objects.filter(room_code=room_code).first()
        if not battle:
            return Response({'error': 'Battle not found.'}, status=404)
        return Response(BattleSerializer(battle).data)

    @action(detail=False, methods=['post'], url_path='room/(?P<room_code>[A-Z0-9]+)/submit')
    def submit(self, request, room_code=None):
        battle = Battle.objects.filter(room_code=room_code).first()
        if not battle:
            return Response({'error': 'Battle not found.'}, status=404)
        if battle.status != BattleStatus.IN_PROGRESS:
            return Response({'error': 'Battle is not in progress.'}, status=400)

        user = request.user
        if user not in [battle.player1, battle.player2]:
            return Response({'error': 'You are not in this battle.'}, status=403)

        code     = request.data.get('code', '')
        language = request.data.get('language', 'python')

        # Judge the submission
        result = judge_submission(code, language, battle.problem)

        # Calculate damage on wrong answer
        damage = 0
        if result['verdict'] != Submission.Verdict.ACCEPTED:
            damage = 20

        # Create submission record
        sub = Submission.objects.create(
            battle=battle,
            problem=battle.problem,
            user=user,
            code=code,
            language=language,
            verdict=result['verdict'],
            test_cases_passed=result['test_cases_passed'],
            test_cases_total=result['test_cases_total'],
            runtime_ms=result.get('runtime_ms', 0),
            error_msg=result.get('error_msg', ''),
            damage_dealt=damage,
        )

        # Update health
        is_p1 = (user == battle.player1)
        if result['verdict'] != Submission.Verdict.ACCEPTED:
            if is_p1:
                battle.p1_health = max(0, battle.p1_health - damage)
            else:
                battle.p2_health = max(0, battle.p2_health - damage)
            battle.save()

        # Accepted = win!
        if result['verdict'] == Submission.Verdict.ACCEPTED:
            battle.end(winner=user)
            battle.problem.total_accepted += 1
            battle.problem.total_attempts += 1
            battle.problem.save()

        battle.problem.total_attempts += 1
        battle.problem.save()

        # Update submission stats
        user.profile.total_submissions += 1
        if result['verdict'] == Submission.Verdict.ACCEPTED:
            user.profile.correct_submissions += 1
            user.profile.problems_solved += 1
        user.profile.save()

        # Broadcast update
        broadcast_battle_update(battle.room_code, 'submission', {
            'user': user.username,
            'verdict': result['verdict'],
            'damage': damage,
            'p1_health': battle.p1_health,
            'p2_health': battle.p2_health,
            'battle_status': battle.status,
            'winner': battle.winner.username if battle.winner else None,
        })

        return Response(SubmissionSerializer(sub).data)

    @action(detail=False, methods=['post'], url_path='room/(?P<room_code>[A-Z0-9]+)/forfeit')
    def forfeit(self, request, room_code=None):
        battle = Battle.objects.filter(room_code=room_code, status=BattleStatus.IN_PROGRESS).first()
        if not battle:
            return Response({'error': 'Active battle not found.'}, status=404)

        user = request.user
        if user not in [battle.player1, battle.player2]:
            return Response({'error': 'You are not in this battle.'}, status=403)

        winner = battle.player2 if user == battle.player1 else battle.player1
        battle.end(winner=winner)
        broadcast_battle_update(battle.room_code, 'forfeit', {'forfeited_by': user.username})
        return Response({'status': 'forfeited', 'winner': winner.username})


    @action(detail=False, methods=['post'], url_path='room/(?P<room_code>[A-Z0-9]+)/leave')
    def leave_room(self, request, room_code=None):
        """Leave a WAITING room — deletes the battle so the slot is freed."""
        battle = Battle.objects.filter(room_code=room_code).first()
        if not battle:
            return Response({'error': 'Room not found.'}, status=404)
        user = request.user
        if user not in [battle.player1, battle.player2]:
            return Response({'error': 'You are not in this room.'}, status=403)
        if battle.status == BattleStatus.IN_PROGRESS:
            return Response({'error': 'Battle already started. Use forfeit instead.'}, status=400)
        battle.delete()
        return Response({'status': 'left'})



import django.db.models as models
