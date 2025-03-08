package websocket

import "time"

type ServerOptions func(opt *serverOption)

type serverOption struct {
	Authentication
	ack               AckType
	ackTimeout        time.Duration
	pattern           string
	maxConnectionIdle time.Duration
}

func newServerOption(opts ...ServerOptions) serverOption {
	o := serverOption{
		Authentication:    new(authentication),
		maxConnectionIdle: defaultMaxConnectionIdle,
		ackTimeout:        defaultAckTimeout,
		pattern:           "/ws",
	}
	for _, opt := range opts {
		opt(&o)
	}
	return o
}

func WithServerAuthentication(auth Authentication) ServerOptions {
	return func(opt *serverOption) {
		opt.Authentication = auth
	}
}

func WithServerAck(ack AckType) ServerOptions {
	return func(opt *serverOption) {
		opt.ack = ack
	}
}

func WithServerMaxConnectionIdle(maxConnectionIdle time.Duration) ServerOptions {
	return func(opt *serverOption) {
		opt.maxConnectionIdle = maxConnectionIdle
	}
}

func WithServerAckTimeout(ackTimeout time.Duration) ServerOptions {
	return func(opt *serverOption) {
		opt.ackTimeout = ackTimeout
	}
}

func WithServerPatten(patten string) ServerOptions {
	return func(opt *serverOption) {
		opt.pattern = patten
	}
}
