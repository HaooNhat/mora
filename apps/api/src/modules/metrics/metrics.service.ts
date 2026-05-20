import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  collectDefaultMetrics,
  Counter,
  Gauge,
  Histogram,
  Registry,
} from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  readonly registry = new Registry();

  readonly httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [this.registry],
  });

  readonly httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [this.registry],
  });

  readonly httpRequestsInFlight = new Gauge({
    name: 'http_requests_in_flight',
    help: 'HTTP requests currently being processed',
    registers: [this.registry],
  });

  readonly authAttemptsTotal = new Counter({
    name: 'auth_attempts_total',
    help: 'Authentication attempts by method and outcome',
    labelNames: ['method', 'outcome'],
    registers: [this.registry],
  });

  readonly requisitionTransitionsTotal = new Counter({
    name: 'requisition_transitions_total',
    help: 'Requisition state transitions',
    labelNames: ['from_state', 'to_state', 'outcome'],
    registers: [this.registry],
  });

  onModuleInit() {
    collectDefaultMetrics({ register: this.registry });
  }
}
