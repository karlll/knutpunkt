package com.ninjacontrol.knutpunkt.logging

import ch.qos.logback.classic.spi.ILoggingEvent
import ch.qos.logback.core.filter.Filter
import ch.qos.logback.core.spi.FilterReply
import io.ktor.utils.io.ClosedWriteChannelException

/**
 * Logback filter that suppresses ClosedWriteChannelException errors
 * from Ktor's SSE heartbeat mechanism.
 *
 * These exceptions occur due to a race condition when SSE clients disconnect
 * while a heartbeat is being sent. They are harmless but noisy in logs.
 *
 * The filter checks if:
 * 1. The exception is a ClosedWriteChannelException
 * 2. The stack trace contains the SSE heartbeat coroutine
 *
 * If both conditions are met, the log event is filtered out (DENY).
 * Otherwise, the event passes through (NEUTRAL).
 */
class SseHeartbeatErrorFilter : Filter<ILoggingEvent>() {

    override fun decide(event: ILoggingEvent): FilterReply {
        val throwable = event.throwableProxy ?: return FilterReply.NEUTRAL

        // Check if it's a ClosedWriteChannelException
        if (throwable.className != ClosedWriteChannelException::class.java.name) {
            return FilterReply.NEUTRAL
        }

        // Check if the exception comes from SSE heartbeat
        // The heartbeat identifier can appear in either className or methodName
        val stackTrace = throwable.stackTraceElementProxyArray ?: return FilterReply.NEUTRAL
        val isFromHeartbeat = stackTrace.any { element ->
            val ste = element.stackTraceElement
            ste.className.contains("ServerSSESession") &&
            (ste.className.contains("heartbeat") || ste.methodName.contains("heartbeat"))
        }

        // Filter out (deny) if it's from heartbeat, otherwise pass through
        return if (isFromHeartbeat) FilterReply.DENY else FilterReply.NEUTRAL
    }
}
