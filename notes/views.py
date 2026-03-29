import socket
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Q
from .models import Note
from .forms import NoteForm


def get_hostname():
    try:
        return socket.gethostname()
    except Exception:
        return "unknown-instance"


def landing(request):
    if request.user.is_authenticated:
        return redirect('dashboard')
    return render(request, 'landing.html', {'hostname': get_hostname()})


@login_required
def dashboard(request):
    query = request.GET.get('q', '')
    category = request.GET.get('category', '')
    notes = Note.objects.filter(user=request.user)

    if query:
        notes = notes.filter(Q(title__icontains=query) | Q(content__icontains=query))
    if category:
        notes = notes.filter(category=category)

    pinned = notes.filter(is_pinned=True)
    regular = notes.filter(is_pinned=False)

    context = {
        'notes': notes,
        'pinned_notes': pinned,
        'regular_notes': regular,
        'hostname': get_hostname(),
        'query': query,
        'selected_category': category,
        'total_notes': Note.objects.filter(user=request.user).count(),
        'categories': Note.CATEGORY_CHOICES,
    }
    return render(request, 'dashboard.html', context)


@login_required
def create_note(request):
    if request.method == 'POST':
        form = NoteForm(request.POST)
        if form.is_valid():
            note = form.save(commit=False)
            note.user = request.user
            note.save()
            messages.success(request, 'Note created successfully!')
            return redirect('dashboard')
    else:
        form = NoteForm()
    return render(request, 'note_form.html', {
        'form': form,
        'action': 'Create',
        'hostname': get_hostname()
    })


@login_required
def view_note(request, pk):
    note = get_object_or_404(Note, pk=pk, user=request.user)
    return render(request, 'note_detail.html', {'note': note, 'hostname': get_hostname()})


@login_required
def edit_note(request, pk):
    note = get_object_or_404(Note, pk=pk, user=request.user)
    if request.method == 'POST':
        form = NoteForm(request.POST, instance=note)
        if form.is_valid():
            form.save()
            messages.success(request, 'Note updated successfully!')
            return redirect('dashboard')
    else:
        form = NoteForm(instance=note)
    return render(request, 'note_form.html', {
        'form': form,
        'note': note,
        'action': 'Update',
        'hostname': get_hostname()
    })


@login_required
def delete_note(request, pk):
    note = get_object_or_404(Note, pk=pk, user=request.user)
    if request.method == 'POST':
        note.delete()
        messages.success(request, 'Note deleted.')
        return redirect('dashboard')
    return render(request, 'note_confirm_delete.html', {'note': note, 'hostname': get_hostname()})
