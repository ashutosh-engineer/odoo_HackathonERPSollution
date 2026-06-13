# ============================================================
# Shiv Furniture Works ERP — Odoo 16 Docker Image
# ============================================================
FROM odoo:16.0

USER root

# Install extra Python dependencies
RUN pip3 install --no-cache-dir \
    pyotp==2.9.0 \
    redis==5.0.1 \
    hiredis==2.3.2 \
    psutil==5.9.8 \
    sentry-sdk==1.40.0

# Copy custom addons
COPY backend/ /mnt/extra-addons/

# Fix permissions
RUN chown -R odoo:odoo /mnt/extra-addons

USER odoo

EXPOSE 8069 8072
