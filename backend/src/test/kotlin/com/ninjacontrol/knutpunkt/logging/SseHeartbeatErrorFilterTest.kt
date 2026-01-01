package com.ninjacontrol.knutpunkt.logging

import ch.qos.logback.classic.Level
import ch.qos.logback.classic.spi.ILoggingEvent
import ch.qos.logback.classic.spi.IThrowableProxy
import ch.qos.logback.classic.spi.StackTraceElementProxy
import ch.qos.logback.core.spi.FilterReply
import io.ktor.utils.io.ClosedWriteChannelException
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Nested
import kotlin.test.assertEquals

class SseHeartbeatErrorFilterTest {

    private lateinit var filter: SseHeartbeatErrorFilter

    @BeforeEach
    fun setup() {
        filter = SseHeartbeatErrorFilter()
    }

    @Nested
    inner class SseHeartbeatErrors {

        @Test
        fun `should filter out ClosedWriteChannelException from SSE heartbeat`() {
            // Create a stack trace that includes SSE heartbeat
            val stackTrace = arrayOf(
                createStackTraceElement("io.ktor.server.sse.ServerSSESessionKt\$heartbeat\$2", "invokeSuspend"),
                createStackTraceElement("kotlinx.coroutines.DispatchedTask", "run"),
                createStackTraceElement("kotlinx.coroutines.scheduling.CoroutineScheduler", "run")
            )

            val throwableProxy = createThrowableProxy(
                ClosedWriteChannelException::class.java.name,
                "Cannot write to channel",
                stackTrace
            )

            val event = createLoggingEvent(throwableProxy)

            val result = filter.decide(event)

            assertEquals(FilterReply.DENY, result, "Should filter out SSE heartbeat ClosedWriteChannelException")
        }

        @Test
        fun `should filter out when heartbeat appears deeper in stack trace`() {
            // Heartbeat not at the top of the stack
            val stackTrace = arrayOf(
                createStackTraceElement("io.ktor.utils.io.ByteChannel", "writeBuffer"),
                createStackTraceElement("io.ktor.server.sse.DefaultServerSSESession", "send"),
                createStackTraceElement("io.ktor.server.sse.ServerSSESessionKt\$heartbeat\$2", "invokeSuspend"),
                createStackTraceElement("kotlinx.coroutines.DispatchedTask", "run")
            )

            val throwableProxy = createThrowableProxy(
                ClosedWriteChannelException::class.java.name,
                "Cannot write to channel",
                stackTrace
            )

            val event = createLoggingEvent(throwableProxy)

            val result = filter.decide(event)

            assertEquals(FilterReply.DENY, result, "Should filter out even when heartbeat is deeper in stack")
        }
    }

    @Nested
    inner class NonHeartbeatErrors {

        @Test
        fun `should allow ClosedWriteChannelException from non-heartbeat source`() {
            // Stack trace without heartbeat
            val stackTrace = arrayOf(
                createStackTraceElement("io.ktor.server.sse.DefaultServerSSESession", "send"),
                createStackTraceElement("com.ninjacontrol.knutpunkt.routes.EventRoutes", "sendEvent"),
                createStackTraceElement("kotlinx.coroutines.DispatchedTask", "run")
            )

            val throwableProxy = createThrowableProxy(
                ClosedWriteChannelException::class.java.name,
                "Cannot write to channel",
                stackTrace
            )

            val event = createLoggingEvent(throwableProxy)

            val result = filter.decide(event)

            assertEquals(FilterReply.NEUTRAL, result, "Should allow ClosedWriteChannelException from non-heartbeat source")
        }

        @Test
        fun `should allow different exception types`() {
            val stackTrace = arrayOf(
                createStackTraceElement("io.ktor.server.sse.ServerSSESessionKt\$heartbeat\$2", "invokeSuspend"),
                createStackTraceElement("kotlinx.coroutines.DispatchedTask", "run")
            )

            val throwableProxy = createThrowableProxy(
                IllegalStateException::class.java.name,
                "Something went wrong",
                stackTrace
            )

            val event = createLoggingEvent(throwableProxy)

            val result = filter.decide(event)

            assertEquals(FilterReply.NEUTRAL, result, "Should allow different exception types")
        }

        @Test
        fun `should allow IOException even from heartbeat`() {
            val stackTrace = arrayOf(
                createStackTraceElement("io.ktor.server.sse.ServerSSESessionKt\$heartbeat\$2", "invokeSuspend"),
                createStackTraceElement("kotlinx.coroutines.DispatchedTask", "run")
            )

            val throwableProxy = createThrowableProxy(
                "java.io.IOException",
                "Network error",
                stackTrace
            )

            val event = createLoggingEvent(throwableProxy)

            val result = filter.decide(event)

            assertEquals(FilterReply.NEUTRAL, result, "Should allow IOException even from heartbeat")
        }
    }

    @Nested
    inner class EdgeCases {

        @Test
        fun `should allow event with null throwable proxy`() {
            val event = createLoggingEvent(null)

            val result = filter.decide(event)

            assertEquals(FilterReply.NEUTRAL, result, "Should allow events with no exception")
        }

        @Test
        fun `should allow event with empty stack trace`() {
            val throwableProxy = createThrowableProxy(
                ClosedWriteChannelException::class.java.name,
                "Cannot write to channel",
                emptyArray()
            )

            val event = createLoggingEvent(throwableProxy)

            val result = filter.decide(event)

            assertEquals(FilterReply.NEUTRAL, result, "Should allow ClosedWriteChannelException with empty stack trace")
        }

        @Test
        fun `should allow event with null stack trace`() {
            val throwableProxy = object : IThrowableProxy {
                override fun getMessage() = "Cannot write to channel"
                override fun getClassName() = ClosedWriteChannelException::class.java.name
                override fun getStackTraceElementProxyArray(): Array<StackTraceElementProxy>? = null
                override fun getCommonFrames() = 0
                override fun getCause(): IThrowableProxy? = null
                override fun getSuppressed(): Array<IThrowableProxy> = emptyArray()
                override fun isCyclic() = false
            }

            val event = createLoggingEvent(throwableProxy)

            val result = filter.decide(event)

            assertEquals(FilterReply.NEUTRAL, result, "Should allow events with null stack trace")
        }
    }

    @Nested
    inner class StackTracePatternMatching {

        @Test
        fun `should match various ServerSSESession class name formats`() {
            val classNames = listOf(
                "io.ktor.server.sse.ServerSSESessionKt\$heartbeat\$2",
                "io.ktor.server.sse.ServerSSESession",
                "io.ktor.server.sse.DefaultServerSSESession"
            )

            classNames.forEach { className ->
                val stackTrace = arrayOf(
                    createStackTraceElement(className, "heartbeat")
                )

                val throwableProxy = createThrowableProxy(
                    ClosedWriteChannelException::class.java.name,
                    "Cannot write to channel",
                    stackTrace
                )

                val event = createLoggingEvent(throwableProxy)
                val result = filter.decide(event)

                assertEquals(
                    FilterReply.DENY,
                    result,
                    "Should filter out for class name: $className"
                )
            }
        }

        @Test
        fun `should match various heartbeat method name formats`() {
            // Test cases with className containing heartbeat identifier
            val testCases = listOf(
                Pair("io.ktor.server.sse.ServerSSESessionKt\$heartbeat\$2", "invokeSuspend"),
                Pair("io.ktor.server.sse.ServerSSESessionKt", "heartbeat"),
                Pair("io.ktor.server.sse.DefaultServerSSESession", "heartbeat\$lambda\$2")
            )

            testCases.forEach { (className, methodName) ->
                val stackTrace = arrayOf(
                    createStackTraceElement(className, methodName)
                )

                val throwableProxy = createThrowableProxy(
                    ClosedWriteChannelException::class.java.name,
                    "Cannot write to channel",
                    stackTrace
                )

                val event = createLoggingEvent(throwableProxy)
                val result = filter.decide(event)

                assertEquals(
                    FilterReply.DENY,
                    result,
                    "Should filter out for className: $className, methodName: $methodName"
                )
            }
        }

        @Test
        fun `should not match partial class name matches`() {
            // Class name contains "ServerSSESession" but without "heartbeat"
            // This should NOT be filtered as it's not from the heartbeat mechanism
            val stackTrace = arrayOf(
                createStackTraceElement("com.example.MyServerSSESessionWrapper", "send")
            )

            val throwableProxy = createThrowableProxy(
                ClosedWriteChannelException::class.java.name,
                "Cannot write to channel",
                stackTrace
            )

            val event = createLoggingEvent(throwableProxy)
            val result = filter.decide(event)

            assertEquals(
                FilterReply.NEUTRAL,
                result,
                "Should not filter custom classes that happen to contain 'ServerSSESession' without heartbeat"
            )
        }
    }

    // Helper functions

    private fun createStackTraceElement(className: String, methodName: String): StackTraceElementProxy {
        val ste = StackTraceElement(className, methodName, "Source.kt", 100)
        return StackTraceElementProxy(ste)
    }

    private fun createThrowableProxy(
        className: String,
        message: String,
        stackTrace: Array<StackTraceElementProxy>
    ): IThrowableProxy {
        return object : IThrowableProxy {
            override fun getMessage() = message
            override fun getClassName() = className
            override fun getStackTraceElementProxyArray() = stackTrace
            override fun getCommonFrames() = 0
            override fun getCause(): IThrowableProxy? = null
            override fun getSuppressed(): Array<IThrowableProxy> = emptyArray()
            override fun isCyclic() = false
        }
    }

    private fun createLoggingEvent(throwableProxy: IThrowableProxy?): ILoggingEvent {
        return object : ILoggingEvent {
            override fun getThreadName() = "test-thread"
            override fun getLevel() = Level.ERROR
            override fun getMessage() = "Unhandled exception"
            override fun getArgumentArray(): Array<Any> = emptyArray()
            override fun getFormattedMessage() = "Unhandled exception"
            override fun getLoggerName() = "io.ktor.server.Application"
            override fun getLoggerContextVO() = null
            override fun getThrowableProxy() = throwableProxy
            override fun getCallerData(): Array<StackTraceElement> = emptyArray()
            override fun hasCallerData() = false
            override fun getMarker() = null
            override fun getMarkerList() = emptyList<org.slf4j.Marker>()
            override fun getMDCPropertyMap(): Map<String, String> = emptyMap()
            override fun getMdc(): Map<String, String> = emptyMap()
            override fun getKeyValuePairs() = emptyList<org.slf4j.event.KeyValuePair>()
            override fun getTimeStamp() = System.currentTimeMillis()
            override fun getNanoseconds() = 0
            override fun getSequenceNumber() = 0L
            override fun prepareForDeferredProcessing() {}
        }
    }
}
