from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from users.views import CustomTokenObtainPairView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth endpoints
    path('api/auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # App endpoints
    path('api/users/', include('users.urls')),
    path('api/problems/', include('problems.urls')),
    path('api/battles/', include('battles.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
