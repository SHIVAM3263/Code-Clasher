from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RegisterView, UserProfileViewSet

router = DefaultRouter()
router.register('profiles', UserProfileViewSet, basename='profile')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('', include(router.urls)),
]
