package main

import (
	"fmt"
	"testing"

	"github.com/opentracing/opentracing-go"
	"github.com/uber/jaeger-client-go"
	jaegercfg "github.com/uber/jaeger-client-go/config"
)

func getTracer() opentracing.Tracer {
	return opentracing.GlobalTracer()
}

func Test_Jaeger(t *testing.T) {
	cfg := jaegercfg.Configuration{
		ServiceName: "client-test",
		Sampler: &jaegercfg.SamplerConfig{
			Type:  jaeger.SamplerTypeConst,
			Param: 1,
		},
		Reporter: &jaegercfg.ReporterConfig{
			LogSpans:          true,
			CollectorEndpoint: fmt.Sprintf("http://%s/api/traces", "127.0.0.1:14268"),
		},
	}

	tracer, closer, err := cfg.NewTracer(jaegercfg.Logger(jaeger.StdLogger))
	if err != nil {
		t.Log(err)
		return
	}
	defer closer.Close()

	// Set as global tracer
	opentracing.SetGlobalTracer(tracer)

	// Create parent span
	parentSpan := tracer.StartSpan("A")
	// Add tags to parent span
	parentSpan.SetTag("version", "1.0.0")
	parentSpan.SetTag("environment", "testing")
	parentSpan.LogKV("event", "test_started", "message", "Starting the test")
	defer parentSpan.Finish()

	// Call function B with the tracer and parent span
	B(tracer, parentSpan)
}

func B(tracer opentracing.Tracer, parentSpan opentracing.Span) {
	childSpan := tracer.StartSpan(
		"B",
		opentracing.ChildOf(parentSpan.Context()),
	)
	// Add tags and logs to child span
	childSpan.SetTag("component", "function-B")
	childSpan.SetTag("span.kind", "function")
	childSpan.LogKV("event", "function_entry", "message", "Entering function B")
	defer func() {
		childSpan.LogKV("event", "function_exit", "message", "Exiting function B")
		childSpan.Finish()
	}()
}
