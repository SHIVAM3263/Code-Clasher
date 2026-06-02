from django.contrib.auth.models import User
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import UserProfile
from .serializers import (
    RegisterSerializer, UserProfileSerializer,
    UserProfileSummarySerializer, CustomTokenObtainPairSerializer
)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'message': 'Account created successfully! Welcome to Code Clasher.',
            'username': user.username,
        }, status=status.HTTP_201_CREATED)


class UserProfileViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = UserProfile.objects.select_related('user').prefetch_related('achievements__achievement')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['user__username', 'country']
    ordering_fields = ['rating', 'battles_won', 'level', 'problems_solved']
    ordering = ['-rating']

    def get_serializer_class(self):
        if self.action == 'list':
            return UserProfileSummarySerializer
        return UserProfileSerializer

    @action(detail=False, methods=['get', 'patch'], url_path='me')
    def me(self, request):
        profile = request.user.profile
        if request.method == 'GET':
            return Response(UserProfileSerializer(profile).data)
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='leaderboard')
    def leaderboard(self, request):
        top_players = UserProfile.objects.select_related('user').order_by('-rating')[:100]
        serializer = UserProfileSummarySerializer(top_players, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='stats')
    def stats(self, request, pk=None):
        profile = self.get_object()
        return Response({
            'rating': profile.rating,
            'rank': profile.rank,
            'level': profile.level,
            'xp': profile.xp,
            'xp_to_next_level': profile.xp_to_next_level,
            'xp_progress_percent': profile.xp_progress_percent,
            'battles_played': profile.battles_played,
            'battles_won': profile.battles_won,
            'battles_lost': profile.battles_lost,
            'win_rate': profile.win_rate,
            'win_streak': profile.win_streak,
            'max_win_streak': profile.max_win_streak,
            'problems_solved': profile.problems_solved,
            'accuracy': profile.accuracy,
        })
