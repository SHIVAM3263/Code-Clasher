from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
import subprocess, tempfile, os, json

from .models import Problem, Tag
from .serializers import ProblemListSerializer, ProblemDetailSerializer, TagSerializer


class TagViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]


class ProblemViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Problem.objects.prefetch_related('tags')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['difficulty']
    search_fields = ['title', 'tags__name']
    ordering_fields = ['difficulty', 'total_accepted', 'created_at']
    lookup_field = 'slug'

    def get_serializer_class(self):
        if self.action == 'list':
            return ProblemListSerializer
        return ProblemDetailSerializer

    @action(detail=True, methods=['post'], url_path='run')
    def run_code(self, request, slug=None):
        """Run code against sample test cases (sandbox execution)"""
        problem = self.get_object()
        code     = request.data.get('code', '')
        language = request.data.get('language', 'python')

        if language != 'python':
            return Response({'error': 'Only Python supported in sandbox currently.'}, status=400)

        results = []
        examples = problem.examples[:3]  # Run against sample cases only

        for i, example in enumerate(examples):
            try:
                result = self._run_python(code, example.get('input', ''), problem.time_limit_ms)
                expected = example.get('output', '').strip()
                passed = result['output'].strip() == expected
                results.append({
                    'case': i + 1,
                    'input': example.get('input', ''),
                    'expected': expected,
                    'actual': result['output'],
                    'passed': passed,
                    'runtime_ms': result['runtime_ms'],
                    'error': result.get('error'),
                })
            except Exception as e:
                results.append({'case': i + 1, 'error': str(e), 'passed': False})

        all_passed = all(r['passed'] for r in results)
        return Response({'results': results, 'all_passed': all_passed})

    def _run_python(self, code: str, stdin_data: str, time_limit_ms: int) -> dict:
        import time
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(code)
            fname = f.name
        try:
            start = time.time()
            proc = subprocess.run(
                ['python3', fname],
                input=stdin_data, capture_output=True, text=True,
                timeout=max(time_limit_ms / 1000, 5),
            )
            elapsed_ms = int((time.time() - start) * 1000)
            return {
                'output': proc.stdout,
                'error': proc.stderr if proc.returncode != 0 else None,
                'runtime_ms': elapsed_ms,
            }
        except subprocess.TimeoutExpired:
            return {'output': '', 'error': 'Time Limit Exceeded', 'runtime_ms': time_limit_ms}
        finally:
            os.unlink(fname)
