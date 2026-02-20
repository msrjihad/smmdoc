import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DEFAULT_SMM_API_SPEC } from '@/lib/provider-api-specification';
import { createApiSpecFromProvider } from '@/lib/provider-api-specification';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || '';
    let spec = { ...DEFAULT_SMM_API_SPEC };
    let httpMethod = 'POST';

    const firstProvider = await db.apiProviders.findFirst({
      where: { status: 'active', deletedAt: null },
      select: {
        api_key_param: true,
        action_param: true,
        services_action: true,
        add_order_action: true,
        service_id_param: true,
        link_param: true,
        quantity_param: true,
        runs_param: true,
        interval_param: true,
        status_action: true,
        order_id_param: true,
        orders_param: true,
        refill_action: true,
        refill_status_action: true,
        refill_id_param: true,
        refills_param: true,
        cancel_action: true,
        balance_action: true,
        http_method: true,
      },
    });

    if (firstProvider) {
      const providerSpec = createApiSpecFromProvider(firstProvider as any);
      spec = { ...DEFAULT_SMM_API_SPEC, ...providerSpec };
      httpMethod = (firstProvider.http_method || 'POST').toUpperCase();
    }

    const apiBaseUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/v2` : '';

    const serviceTypes = await getServiceTypes(spec);

    return NextResponse.json({
      success: true,
      data: {
        baseUrl: apiBaseUrl,
        httpMethod,
        spec: {
          apiKeyParam: spec.apiKeyParam,
          actionParam: spec.actionParam,
          servicesAction: spec.servicesAction,
          addOrderAction: spec.addOrderAction,
          serviceIdParam: spec.serviceIdParam,
          linkParam: spec.linkParam,
          quantityParam: spec.quantityParam,
          runsParam: spec.runsParam,
          intervalParam: spec.intervalParam,
          statusAction: spec.statusAction,
          orderIdParam: spec.orderIdParam,
          ordersParam: spec.ordersParam,
          refillAction: spec.refillAction,
          refillStatusAction: spec.refillStatusAction,
          refillIdParam: spec.refillIdParam,
          refillsParam: spec.refillsParam,
          cancelAction: spec.cancelAction,
          balanceAction: spec.balanceAction,
        },
        serviceTypes,
      },
    });
  } catch (error) {
    console.error('Error fetching API documentation spec:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load API spec' },
      { status: 500 }
    );
  }
}

async function getServiceTypes(spec: {
  apiKeyParam: string;
  actionParam: string;
  addOrderAction: string;
  serviceIdParam: string;
  linkParam: string;
  quantityParam: string;
  runsParam: string;
  intervalParam: string;
}) {
  const packageTypes = await db.services.findMany({
    where: { status: 'active', deletedAt: null },
    select: { packageType: true },
    distinct: ['packageType'],
  });

  const typeMap: Record<number, { id: number; name: string; parameters: { name: string; description: string; required?: boolean }[] }> = {
    0: {
      id: 0,
      name: 'Default',
      parameters: [
        { name: spec.apiKeyParam, description: 'Your API key', required: true },
        { name: spec.actionParam, description: spec.addOrderAction, required: true },
        { name: spec.serviceIdParam, description: 'Service ID', required: true },
        { name: spec.linkParam, description: 'Link to page', required: true },
        { name: spec.quantityParam, description: 'Needed quantity', required: true },
        { name: `${spec.runsParam} (optional)`, description: 'Runs to deliver' },
        { name: `${spec.intervalParam} (optional)`, description: 'Interval in minutes' },
      ],
    },
    1: {
      id: 1,
      name: 'SEO',
      parameters: [
        { name: spec.apiKeyParam, description: 'Your API key', required: true },
        { name: spec.actionParam, description: spec.addOrderAction, required: true },
        { name: spec.serviceIdParam, description: 'Service ID', required: true },
        { name: spec.linkParam, description: 'Link to page', required: true },
        { name: spec.quantityParam, description: 'Needed quantity', required: true },
        { name: 'keywords', description: 'Keywords list separated by \\r\\n or \\n', required: true },
      ],
    },
    2: {
      id: 2,
      name: 'Custom Comments',
      parameters: [
        { name: spec.apiKeyParam, description: 'Your API key', required: true },
        { name: spec.actionParam, description: spec.addOrderAction, required: true },
        { name: spec.serviceIdParam, description: 'Service ID', required: true },
        { name: spec.linkParam, description: 'Link to page', required: true },
        { name: 'comments', description: 'Comments list separated by \\r\\n or \\n', required: true },
      ],
    },
    10: {
      id: 10,
      name: 'Package',
      parameters: [
        { name: spec.apiKeyParam, description: 'Your API key', required: true },
        { name: spec.actionParam, description: spec.addOrderAction, required: true },
        { name: spec.serviceIdParam, description: 'Service ID', required: true },
        { name: spec.linkParam, description: 'Link to page', required: true },
      ],
    },
    100: {
      id: 100,
      name: 'Subscriptions',
      parameters: [
        { name: spec.apiKeyParam, description: 'Your API key', required: true },
        { name: spec.actionParam, description: spec.addOrderAction, required: true },
        { name: spec.serviceIdParam, description: 'Service ID', required: true },
        { name: 'username', description: 'Username', required: true },
        { name: 'min', description: 'Quantity min', required: true },
        { name: 'max', description: 'Quantity max', required: true },
        { name: 'delay', description: 'Delay in minutes', required: true },
      ],
    },
  };

  const types = packageTypes
    .map((p) => typeMap[p.packageType ?? 0] || typeMap[0])
    .filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i);

  return types.length > 0 ? types : [typeMap[0]];
}
