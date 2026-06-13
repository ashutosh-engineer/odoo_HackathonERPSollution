FROM odoo:16.0

USER root

# Install compiler dependencies for python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

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
