Project Explainer
1. The Tree: Efficient Nested Comments
How we modeled it: I used a simple Adjacency List pattern. The 
Comment
 model has a parent field which is a formatting Self-Referential Foreign Key.

class Comment(models.Model):
    # ...
    parent = models.ForeignKey('self', null=True, blank=True, ...)
How we optimized it (No Recursive Queries): Instead of hitting the database recursively for every comment (which causes N+1 problems), I fetch all comments for a post in exactly one query.

# views.py
comments = Comment.objects.filter(post=instance).select_related('author').order_by('created_at')
I then construct the tree structure in memory using Python dictionaries. This is $O(N)$ complexity and extremely fast for typical usage.

# Logic in PostViewSet.retrieve
comment_map = {c.id: c for c in comments}
root_comments = []
for c in comments:
    if c.parent_id:
        parent = comment_map.get(c.parent_id)
        if parent:
            parent._prefetched_replies.append(c)
    else:
        root_comments.append(c)
By manually attaching _prefetched_replies, the 
CommentSerializer
 (which looks for this attribute) can serialize the nested structure without triggering new DB lookups.

2. The Math: 24h Rolling Leaderboard
The leaderboard requires calculating points dynamically based on the last 24 hours:

+5 points for every Like on your Post.
+1 point for every Like on your Comment.
The Strategy: Database aggregation is used to sum the points. Since users can accumulate points from both sources, I performed two separate optimized aggregates and combined them.

# LeaderboardView logic
time_threshold = timezone.now() - timedelta(hours=24)
# 1. Calculate points from Post Likes
top_post_authors = Post.objects.filter(
    likes__created_at__gte=time_threshold
).values('author__id', 'author__username').annotate(
    points=Count('likes') * 5
)
# 2. Calculate points from Comment Likes
top_comment_authors = Comment.objects.filter(
    likes__created_at__gte=time_threshold
).values('author__id', 'author__username').annotate(
    points=Count('likes') * 1
)
The results are merged in Python to produce the final sorted list. This avoids complex UNION queries while keeping performance high for the expected dataset size.

3. The AI Audit: A Bug I Fixed
The Bug: When I initially implemented the "Create Post" feature, the frontend sent the content, but the backend returned a 500 Internal Server Error.

The Cause: The 
Post
 model requires an author. However, the serializer was not receiving the author from the request body (as it shouldn't), and the ViewSet had no logic to inject the logged-in user.

The Fix: I overrode the 
perform_create
 method in 
PostViewSet
 to explicitly attach the user:

def perform_create(self, serializer):
    serializer.save(author=self.request.user)
This ensures that every post is correctly linked to the authenticated user without requiring the frontend to send sensitive user IDs.
