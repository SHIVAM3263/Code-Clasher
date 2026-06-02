from rest_framework import serializers
from .models import Problem, Tag


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'color']


class ProblemListSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    acceptance_rate = serializers.FloatField(read_only=True)
    xp_reward = serializers.IntegerField(read_only=True)

    class Meta:
        model = Problem
        fields = [
            'id', 'title', 'slug', 'difficulty', 'tags',
            'total_attempts', 'total_accepted', 'acceptance_rate',
            'xp_reward', 'created_at',
        ]


class ProblemDetailSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    acceptance_rate = serializers.FloatField(read_only=True)
    xp_reward = serializers.IntegerField(read_only=True)

    class Meta:
        model = Problem
        fields = [
            'id', 'title', 'slug', 'description', 'difficulty', 'tags',
            'time_limit_ms', 'memory_limit_mb', 'examples', 'starter_code',
            'total_attempts', 'total_accepted', 'acceptance_rate',
            'xp_reward', 'battle_weight', 'created_at',
        ]
