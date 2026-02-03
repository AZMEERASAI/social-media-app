from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Post, Comment, Like

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']

class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    replies = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'post', 'author', 'content', 'parent', 'created_at', 'replies', 'likes_count', 'is_liked']
        read_only_fields = ['author', 'created_at']

    def get_replies(self, obj):
        if hasattr(obj, '_prefetched_replies'):
            return CommentSerializer(obj._prefetched_replies, many=True, context=self.context).data
        return []

    def get_likes_count(self, obj):
        return getattr(obj, 'likes_count', 0)

    def get_is_liked(self, obj):
        return getattr(obj, 'is_liked', False)

class PostSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    likes_count = serializers.IntegerField(read_only=True)
    comments_count = serializers.IntegerField(read_only=True)
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ['id', 'author', 'content', 'created_at', 'likes_count', 'comments_count', 'is_liked']

    def get_is_liked(self, obj):
        user = self.context.get('request').user
        if user.is_authenticated:
            # Optimized lookup if 'is_liked' is annotated or prefetched
            return getattr(obj, 'user_has_liked', False)
        return False

class PostDetailSerializer(PostSerializer):
    comments = serializers.SerializerMethodField()

    class Meta(PostSerializer.Meta):
        fields = PostSerializer.Meta.fields + ['comments']

    def get_comments(self, obj):
        # This expects that views already set '_comment_tree' on the obj
        if hasattr(obj, '_comment_tree'):
            return CommentSerializer(obj._comment_tree, many=True, context=self.context).data
        return []

class LikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = ['id', 'user', 'content_type', 'object_id', 'created_at']
