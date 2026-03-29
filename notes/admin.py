from django.contrib import admin
from .models import Note

@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'category', 'is_pinned', 'created_at', 'updated_at']
    list_filter = ['category', 'is_pinned', 'user']
    search_fields = ['title', 'content']
    ordering = ['-updated_at']
