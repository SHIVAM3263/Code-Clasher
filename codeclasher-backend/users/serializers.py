from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import UserProfile, Achievement, UserAchievement


class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = ['id', 'name', 'description', 'icon', 'category', 'xp_reward']


class UserAchievementSerializer(serializers.ModelSerializer):
    achievement = AchievementSerializer(read_only=True)

    class Meta:
        model = UserAchievement
        fields = ['achievement', 'earned_at']


class UserProfileSerializer(serializers.ModelSerializer):
    username    = serializers.CharField(source='user.username', read_only=True)
    email       = serializers.EmailField(source='user.email', read_only=True)
    first_name  = serializers.CharField(source='user.first_name', read_only=True)
    last_name   = serializers.CharField(source='user.last_name', read_only=True)
    achievements = UserAchievementSerializer(many=True, read_only=True)
    win_rate    = serializers.FloatField(read_only=True)
    accuracy    = serializers.FloatField(read_only=True)
    xp_to_next_level    = serializers.IntegerField(read_only=True)
    xp_progress_percent = serializers.FloatField(read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'avatar', 'bio', 'country', 'rating', 'xp', 'level', 'rank',
            'battles_played', 'battles_won', 'battles_lost',
            'win_streak', 'max_win_streak', 'win_rate',
            'total_submissions', 'correct_submissions', 'problems_solved', 'accuracy',
            'is_online', 'last_seen', 'created_at',
            'achievements', 'xp_to_next_level', 'xp_progress_percent',
        ]


class UserProfileSummarySerializer(serializers.ModelSerializer):
    """Lightweight serializer for listings"""
    username = serializers.CharField(source='user.username', read_only=True)
    win_rate = serializers.FloatField(read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            'id', 'username', 'avatar', 'rating', 'level', 'rank',
            'battles_won', 'battles_played', 'win_rate', 'win_streak',
            'problems_solved', 'is_online',
        ]


class RegisterSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['rank']     = user.profile.rank
        token['level']    = user.profile.level
        token['rating']   = user.profile.rating
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserProfileSerializer(self.user.profile).data
        return data
