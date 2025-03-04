# Generated by Django 5.1.6 on 2025-02-27 14:13

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0002_roominvitation'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='roominvitation',
            name='to_user',
            field=models.ForeignKey(default=None, on_delete=django.db.models.deletion.CASCADE, related_name='to_user', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='roominvitation',
            name='creator',
            field=models.ForeignKey(default=None, on_delete=django.db.models.deletion.CASCADE, related_name='creator', to=settings.AUTH_USER_MODEL),
        ),
    ]
