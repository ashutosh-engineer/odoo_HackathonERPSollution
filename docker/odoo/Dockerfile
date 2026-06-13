# ============================================================
# Shiv Furniture Works ERP — Odoo 16 Docker Image
# Custom modules are volume-mounted at /mnt/extra-addons
# so code changes reflect without rebuild
# ============================================================
FROM odoo:16.0

USER root

# Install extra Python dependencies needed by our modules
RUN pip3 install --no-cache-dir \
    pyotp==2.9.0 \
    redis==5.0.1 \
    hiredis==2.3.2 \
    psutil==5.9.8

# Create addons directory
RUN mkdir -p /mnt/extra-addons && chown -R odoo:odoo /mnt/extra-addons

USER odoo

EXPOSE 8069 8072
