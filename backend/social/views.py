from rest_framework import viewsets, status, generics, permissions, views
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from django.db.models import Count, Q, Case, When, IntegerField, Sum, Exists, OuterRef, F, Value
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from django.utils import timezone
from datetime import timedelta
from .models import Post, Comment, Like
from .serializers import PostSerializer, PostDetailSerializer, CommentSerializer, UserSerializer, LikeSerializer

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
        
        # Annotate likes_count using GenericRelation
        queryset = queryset.annotate(likes_count=Count('likes', distinct=True))
        
        # Annotate comments_count (direct FK)
        queryset = queryset.annotate(comments_count=Count('comments', distinct=True))

        if user.is_authenticated:
            post_ct = ContentType.objects.get_for_model(Post)
            is_liked_subquery = Like.objects.filter(
                content_type=post_ct,
                object_id=OuterRef('pk'),
                user=user
            )
            queryset = queryset.annotate(user_has_liked=Exists(is_liked_subquery))
            
        return queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        comments = Comment.objects.filter(post=instance).select_related('author').order_by('created_at')
        
        comment_ct = ContentType.objects.get_for_model(Comment)
        comments = comments.annotate(likes_count=Count('likes', distinct=True))
        
        if request.user.is_authenticated:
             is_liked_subquery = Like.objects.filter(
                content_type=comment_ct,
                object_id=OuterRef('pk'),
                user=request.user
            )
             comments = comments.annotate(user_has_liked=Exists(is_liked_subquery))
        
        comment_map = {c.id: c for c in comments}
        root_comments = []
        
        for c in comments:
            c._prefetched_replies = []
            c.is_liked = getattr(c, 'user_has_liked', False)
            if c.parent_id:
                parent = comment_map.get(c.parent_id)
                if parent:
                    parent._prefetched_replies.append(c)
                else:
                    root_comments.append(c)
            else:
                root_comments.append(c)

        instance._comment_tree = root_comments
        instance.user_has_liked = getattr(instance, 'user_has_liked', False)
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

class CommentViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class LikeViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request):
        target_type = request.data.get('target_type')
        target_id = request.data.get('target_id')
        
        if not target_type or not target_id:
            return Response({'error': 'Missing parameters'}, status=status.HTTP_400_BAD_REQUEST)
        
        model = None
        if target_type == 'post':
            model = Post
        elif target_type == 'comment':
            model = Comment
        else:
            return Response({'error': 'Invalid target type'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            content_type = ContentType.objects.get_for_model(model)
            like, created = Like.objects.get_or_create(
                user=request.user,
                content_type=content_type,
                object_id=target_id
            )
            
            if not created:
                like.delete()
                return Response({'status': 'unliked'}, status=status.HTTP_200_OK)
            
            return Response({'status': 'liked'}, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class LeaderboardView(views.APIView):
    def get(self, request):
        time_threshold = timezone.now() - timedelta(hours=24)
        
        # Determine aggregate likes for Posts
        # Post likes give 5 points to post.author
        top_post_authors = Post.objects.filter(
            likes__created_at__gte=time_threshold
        ).values('author__id', 'author__username').annotate(
            points=Count('likes') * 5
        )
        
        # Determine aggregate likes for Comments
        # Comment likes give 1 point to comment.author
        top_comment_authors = Comment.objects.filter(
            likes__created_at__gte=time_threshold
        ).values('author__id', 'author__username').annotate(
            points=Count('likes') * 1
        )
        
        user_scores = {}
        
        for item in top_post_authors:
            uid = item['author__id']
            username = item['author__username']
            score = item['points']
            if uid not in user_scores:
                user_scores[uid] = {'id': uid, 'username': username, 'score': 0}
            user_scores[uid]['score'] += score
            
        for item in top_comment_authors:
            uid = item['author__id']
            username = item['author__username']
            score = item['points']
            if uid not in user_scores:
                user_scores[uid] = {'id': uid, 'username': username, 'score': 0}
            user_scores[uid]['score'] += score
            
        leaderboard = sorted(user_scores.values(), key=lambda x: x['score'], reverse=True)[:5]
        return Response(leaderboard)

class CurrentUserView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        return Response(UserSerializer(request.user).data)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register(request):
    username = request.data.get('username')
    password = request.data.get('password')
    if not username or not password:
        return Response({'error': 'Username and password required'}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username taken'}, status=status.HTTP_400_BAD_REQUEST)
    user = User.objects.create_user(username=username, password=password)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({'token': token.key, 'user_id': user.id, 'username': user.username})

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    if user:
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'user_id': user.id, 'username': user.username})
    return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)
