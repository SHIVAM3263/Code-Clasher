from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BattleViewSet

router = DefaultRouter()
router.register('', BattleViewSet, basename='battle')

urlpatterns = [path('', include(router.urls))]
