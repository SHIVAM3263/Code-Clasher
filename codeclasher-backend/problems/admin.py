from django.contrib import admin
from .models import Problem, Tag, TestCase


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display  = ('name', 'color')
    search_fields = ('name',)


class TestCaseInline(admin.TabularInline):
    model = TestCase
    extra = 2
    fields = ('input_data', 'output_data', 'is_sample', 'order')


@admin.register(Problem)
class ProblemAdmin(admin.ModelAdmin):
    list_display    = ('title', 'difficulty', 'slug', 'created_at')
    list_filter     = ('difficulty',)
    search_fields   = ('title', 'slug')
    prepopulated_fields = {'slug': ('title',)}
    filter_horizontal = ('tags',)
    inlines         = [TestCaseInline]
    ordering        = ('difficulty', 'title')


@admin.register(TestCase)
class TestCaseAdmin(admin.ModelAdmin):
    list_display  = ('problem', 'is_sample', 'order')
    list_filter   = ('is_sample', 'problem')
