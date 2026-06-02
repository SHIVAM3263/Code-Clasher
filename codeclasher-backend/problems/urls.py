from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProblemViewSet, TagViewSet

router = DefaultRouter()
router.register('', ProblemViewSet, basename='problem')
router.register('tags', TagViewSet, basename='tag')

urlpatterns = [path('', include(router.urls))]
