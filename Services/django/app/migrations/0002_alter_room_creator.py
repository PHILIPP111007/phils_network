# Generated by Django 5.1.7 on 2025-03-22 16:20

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='room',
            name='creator',
            field=models.ForeignKey(default=None, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='room_creator', to=settings.AUTH_USER_MODEL),
        ),
    ]
