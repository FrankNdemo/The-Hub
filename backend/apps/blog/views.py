from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.therapists.permissions import IsTherapistAuthenticated

from .models import BlogPost
from .serializers import BlogPostSerializer, BlogPostWriteSerializer
from .services import create_or_update_post


class PublicBlogPostListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    queryset = BlogPost.objects.filter(is_published=True).select_related("author")
    serializer_class = BlogPostSerializer


class PublicBlogPostDetailView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    queryset = BlogPost.objects.filter(is_published=True).select_related("author")
    serializer_class = BlogPostSerializer
    lookup_field = "slug"


class TherapistBlogPostListCreateView(APIView):
    permission_classes = [IsTherapistAuthenticated]

    def get(self, request):
        posts = BlogPost.objects.select_related("author").all()
        return Response(BlogPostSerializer(posts, many=True).data)

    def post(self, request):
        serializer = BlogPostWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        post = create_or_update_post(
            therapist=request.user.therapist_profile,
            instance=None,
            data=serializer.validated_data,
        )
        return Response(BlogPostSerializer(post).data, status=status.HTTP_201_CREATED)


class TherapistBlogPostDetailView(APIView):
    permission_classes = [IsTherapistAuthenticated]

    def patch(self, request, pk):
        post = generics.get_object_or_404(BlogPost, pk=pk)
        serializer = BlogPostWriteSerializer(post, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        base_data = {
            "title": post.title,
            "category": post.category,
            "author": post.author_name,
            "excerpt": post.excerpt,
            "featured_image_url": post.featured_image_url,
            "content_html": post.content_html,
            "tags": post.tags,
            "publish_date": post.publish_date,
        }
        updated_post = create_or_update_post(
            therapist=request.user.therapist_profile,
            instance=post,
            data={**base_data, **serializer.validated_data},
        )
        return Response(BlogPostSerializer(updated_post).data)

    def delete(self, request, pk):
        post = generics.get_object_or_404(BlogPost, pk=pk)
        post.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
