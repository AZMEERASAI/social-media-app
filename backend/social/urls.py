from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'posts', views.PostViewSet)
router.register(r'comments', views.CommentViewSet)
router.register(r'likes', views.LikeViewSet, basename='like')

urlpatterns = [
    path('', include(router.urls)),
    path('leaderboard/', views.LeaderboardView.as_view(), name='leaderboard'),
    path('me/', views.CurrentUserView.as_view(), name='me'),
    path('auth/register/', views.register, name='register'),
    path('auth/login/', views.login, name='login'),
]
