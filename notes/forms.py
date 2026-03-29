from django import forms
from .models import Note


class NoteForm(forms.ModelForm):
    class Meta:
        model = Note
        fields = ['title', 'content', 'category', 'is_pinned']
        widgets = {
            'title': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'Note title...',
                'autofocus': True,
            }),
            'content': forms.Textarea(attrs={
                'class': 'form-textarea',
                'placeholder': 'Write your note here...',
                'rows': 10,
            }),
            'category': forms.Select(attrs={
                'class': 'form-select',
            }),
            'is_pinned': forms.CheckboxInput(attrs={
                'class': 'form-checkbox',
            }),
        }
