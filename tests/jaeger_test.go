/**
 * @author: dn-jinmin/dn-jinmin
 * @doc:
 */

package main

import (
	"context"
	"github.com/zeromicro/go-zero/core/trace"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	oteltrace "go.opentelemetry.io/otel/trace"
	"testing"
)

var tracerTestAttributeKey = attribute.Key("test.tracer.desc")

func StartAgent(name string) {
	trace.StartAgent(trace.Config{
		Name:     name,
		Endpoint: "http://192.168.117.24:14268/api/traces",
		Sampler:  1,
		Batcher:  "jaeger",
		Disabled: false,
	})
}
func Test_tracers(t *testing.T) {
	//t.Run("启动", func(t *testing.T) {
	//	StartAgent("test.go-zero.tracer")
	//	ctx, span := otel.Tracer(trace.TraceName).Start(context.Background(), "a")
	//
	//	span.SetStatus(codes.Ok, "")
	//	t.Log("is recording", span.IsRecording())
	//	exec(t, ctx, "exec", "exec")
	//	span.End() // 异步执行
	//
	//	for {
	//	}
	//})

	t.Run("加载", func(t *testing.T) {
		StartAgent("test.go-zero.tracer----2")
		tr := otel.Tracer(trace.TraceName)

		// 得到traceid 和 spanid
		traceId, err := oteltrace.TraceIDFromHex("cc4d583faaa4d63f6e9d2cef454ba252")
		if err != nil {
			t.Log(err)
			return
		}
		spanId, err := oteltrace.SpanIDFromHex("84d42a90466d42cd")
		if err != nil {
			t.Log(err)
			return
		}
		spanContext := oteltrace.NewSpanContext(oteltrace.SpanContextConfig{
			TraceID:    traceId,
			SpanID:     spanId,
			TraceFlags: oteltrace.FlagsSampled,
		})

		// 当前任务span
		_, span := tr.Start(oteltrace.ContextWithRemoteSpanContext(context.Background(), spanContext), "example-span")
		span.SetStatus(codes.Ok, "")
		span.End()
		// 执行任务
		for {
		}
	})
}

func exec(t *testing.T, ctx context.Context, spanName, desc string) {
	tracer := trace.TracerFromContext(ctx)
	_, span := tracer.Start(ctx, spanName)
	span.SetAttributes(tracerTestAttributeKey.String(desc))
	span.SetStatus(codes.Ok, "")
	defer span.End()
	// 任务处理

	t.Log("处理任务 ： traceid", span.SpanContext().TraceID().String())
	t.Log("处理任务 ： spanid", span.SpanContext().SpanID().String())
}

//func Test_Jaeger(t *testing.T) {
//	cfg := jaegercfg.Configuration{
//		Sampler: &jaegercfg.SamplerConfig{
//			Type:  jaeger.SamplerTypeConst,
//			Param: 1,
//		},
//		Reporter: &jaegercfg.ReporterConfig{
//			LogSpans:          true,
//			CollectorEndpoint: fmt.Sprintf("http://%s/api/traces", "192.168.117.24:14268"),
//		},
//	}
//
//	Jaeger, err := cfg.InitGlobalTracer("client test", jaegercfg.Logger(jaeger.StdLogger))
//	if err != nil {
//		t.Log(err)
//		return
//	}
//	defer Jaeger.Close()
//
//	// 任务的执行
//	tracer := opentracing.GlobalTracer()
//
//	// 任务节点定义span
//	parentSpan := tracer.StartSpan("A")
//	defer parentSpan.Finish()
//
//	B(tracer, parentSpan)
//}
//func B(tracer opentracing.Tracer, parentSpan opentracing.Span) {
//	childSpan := tracer.StartSpan("B", opentracing.ChildOf(parentSpan.Context()))
//	defer childSpan.Finish()
//}
