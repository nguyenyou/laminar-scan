package www

import com.raquo.laminar.api.L.*
import base.LaminarComponent
import org.scalajs.dom

import scala.scalajs.js
import scala.scalajs.js.typedarray.Float64Array

/** Demo component that causes memory leaks by accumulating data. Watch the
  * Memory meter grow when you click "Leak Memory"!
  */
case class MemoryLeaker() extends LaminarComponent {
  private val leakCount = Var(0)
  private val totalMB = Var(0.0)

  // This simulates a memory leak - data that accumulates and is never released
  // Common causes in real apps:
  // - Event listeners not cleaned up
  // - Closures holding references
  // - Growing caches without limits
  // - Forgotten subscriptions
  private val leakedData = js.Array[Float64Array]()

  private def leakMemory(): Unit = {
    // Allocate ~10MB of data that won't be garbage collected
    // because it's held in the leakedData array
    val arraySize = 1310720 // 1.28M * 8 bytes = ~10MB
    val data = new Float64Array(arraySize)

    // Fill with random data to ensure it's actually allocated
    for (i <- 0 until arraySize) {
      data(i) = Math.random()
    }

    leakedData.push(data)
    leakCount.update(_ + 1)
    totalMB.update(_ + 10.0)
  }

  private def clearLeaks(): Unit = {
    // In a real app, this would be like properly cleaning up resources
    leakedData.length = 0
    leakCount.set(0)
    totalMB.set(0.0)

    // Force garbage collection hint (browser may ignore)
    // In real apps, memory might not drop immediately
    dom.console.log("Cleared leaked data. GC should reclaim memory soon.")
  }

  def render(): HtmlElement = {
    div(
      cls(
        "flex flex-col gap-4 p-6 border border-yellow-300 rounded-lg bg-yellow-50 max-w-sm"
      ),
      div(cls("text-lg font-bold text-yellow-700"), "📈 Memory Leak Demo"),
      div(
        cls("text-sm text-gray-600"),
        "Click to allocate memory that won't be released. Watch the Memory meter grow!"
      ),

      // Memory stats display
      div(
        cls("flex gap-4 py-4 justify-center"),
        div(
          cls("text-center"),
          div(
            cls("text-3xl font-bold text-yellow-600"),
            child.text <-- leakCount.signal
          ),
          div(cls("text-xs text-gray-500"), "Leaks")
        ),
        div(
          cls("text-center"),
          div(
            cls("text-3xl font-bold text-yellow-600"),
            child.text <-- totalMB.signal.map(mb => f"$mb%.0f MB")
          ),
          div(cls("text-xs text-gray-500"), "Leaked")
        )
      ),
      div(
        cls("flex gap-2"),
        button(
          cls(
            "flex-1 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          ),
          onClick --> Observer { _ => leakMemory() },
          "Leak ~10MB"
        ),
        button(
          cls(
            "flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          ),
          onClick --> Observer { _ => clearLeaks() },
          "Clear Leaks"
        )
      ),
      div(
        cls("text-xs text-gray-500 mt-2"),
        "💡 Each click allocates a Float64Array held in memory. The Memory meter (Chrome only) shows heap growth."
      )
    )
  }
}
