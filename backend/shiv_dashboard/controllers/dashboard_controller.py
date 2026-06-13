# -*- coding: utf-8 -*-
"""
Module 7 — Dashboard API
GET /shiv/dashboard/kpis  — Full KPI payload (Redis-cached, <50ms)
GET /shiv/dashboard/alerts — Low stock + security alerts
"""
import json
from odoo import http
from odoo.http import request, Response


def json_ok(data):
    return Response(json.dumps({'success': True, 'data': data}, default=str),
                    mimetype='application/json', status=200)


def json_err(msg, status=400):
    return Response(json.dumps({'success': False, 'error': msg}),
                    mimetype='application/json', status=status)


class ShivDashboardController(http.Controller):

    @http.route('/shiv/dashboard/kpis', type='http', auth='user', methods=['GET'], csrf=False)
    def get_kpis(self, **kwargs):
        if not request.session.uid:
            return json_err('Unauthenticated', 401)
        kpis = request.env['shiv.kpi'].sudo().get_dashboard_kpis()
        return json_ok(kpis)

    @http.route('/shiv/dashboard/alerts', type='http', auth='user', methods=['GET'], csrf=False)
    def get_alerts(self, **kwargs):
        if not request.session.uid:
            return json_err('Unauthenticated', 401)
        kpis = request.env['shiv.kpi'].sudo().get_dashboard_kpis()
        return json_ok({
            'low_stock': kpis['alerts']['low_stock'],
            'low_stock_count': kpis['alerts']['low_stock_count'],
        })

    @http.route('/shiv/dashboard/invalidate-cache', type='http', auth='user',
                methods=['POST'], csrf=False)
    def invalidate_cache(self, **kwargs):
        """Admin only — force KPI cache refresh."""
        if not request.env.user.has_group('shiv_auth.group_shiv_admin'):
            return json_err('Forbidden', 403)
        request.env['shiv.kpi'].sudo().invalidate_cache()
        return json_ok({'message': 'KPI cache invalidated.'})
