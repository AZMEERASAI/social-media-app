from rest_framework import viewsets, status, generics, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Count, Q, Case, When, IntegerField, Sum, Exists, OuterRef, F
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from datetime import timedelta
from .models import Post, Comment, Like
from .serializers import PostSerializer, PostDetailSerializer, CommentSerializer, UserSerializer

class PostViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    queryset = Post.objects.all()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PostDetailSerializer
        return PostSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Post.objects.select_related('author').order_by('-created_at')
        
        # Annotate likes and comments count
        queryset = queryset.annotate(
            likes_count=Count('likes', distinct=True), # 'likes' related name on Post model? No, GenericRelation not defined.
            # Wait, I didn't define GenericRelation on Post/Comment.
            # But I can filter Like by content_type.
            # Standard 'likes' related_name query from Like model won't work directly if it's GenericForeignKey without GenericRelation
            # Actually, `related_name='likes'` in Like model refers to User.
            # I cannot reverse relation easily without GenericRelation.
            # I will assume I need to fix Models or use filtered relation.
        )
        # Actually without GenericRelation, Count('likes') won't work.
        # I should add GenericRelation to models OR use Subquery.
        # Let's use Subquery/Count with filter.
        # But for 'interview quality', GenericRelation is cleaner.
        # I will modify Models first? Or use custom annotation here.
        # Custom annotation is safer if I don't want to migrate again right now (though I can).
        # Let's use GenericRelation method in a bit. PASS for now.
        return queryset

    # I'll override list and retrieve to handle the complexity manually or fix models.
    # Fixing models to add GenericRelation is best for "likes_count".
    pass

# I will fix the models first to include GenericRelation for cleaner querying.
