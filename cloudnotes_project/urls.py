from django.contrib import admin
from django.urls import path, include
from notes import views as note_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', note_views.landing, name='landing'),
    path('dashboard/', note_views.dashboard, name='dashboard'),
    path('notes/create/', note_views.create_note, name='create_note'),
    path('notes/<int:pk>/', note_views.view_note, name='view_note'),
    path('notes/<int:pk>/edit/', note_views.edit_note, name='edit_note'),
    path('notes/<int:pk>/delete/', note_views.delete_note, name='delete_note'),
    path('accounts/', include('accounts.urls')),
]
