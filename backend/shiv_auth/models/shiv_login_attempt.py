# -*- coding: utf-8 -*-
"""
shiv_auth/models/shiv_login_attempt.py
Re-exports ShivLoginAttempt from shiv_role to satisfy __init__.py import.
The actual class is defined in shiv_role.py to keep related auth models together.
"""
# ShivLoginAttempt is defined in shiv_role.py
# This file exists to satisfy the models/__init__.py import structure
from .shiv_role import ShivLoginAttempt  # noqa: F401
