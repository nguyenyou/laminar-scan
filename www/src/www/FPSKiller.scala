package www

import com.raquo.laminar.api.L.*
import base.LaminarComponent
import org.scalajs.dom

import scala.scalajs.js

/** Demo component that causes FPS drops by blocking the main thread.
  * Watch the FPS meter drop when you click "Block Main Thread"!
  */
case class FPSKiller() extends LaminarComponent {
  private val isBlocking = Var(false)
  private val rotation = Var(0.0)
  private var animationId: Int = 0

  // Animate the spinner continuously
  private def startAnimation(): Unit = {
    def loop(): Unit = {
      rotation.update(_ + 3)
      animationId = dom.window.requestAnimationFrame(_ => loop())
    }
    loop()
  }

  private def stopAnimation(): Unit = {
    dom.window.cancelAnimationFrame(animationId)
  }

  // Block the main thread with heavy computation (simulates bad code)
  private def blockMainThread(): Unit = {
    isBlocking.set(true)

    // Heavy synchronous computation that blocks the event loop
    // This simulates expensive operations like:
    // - Large JSON parsing
    // - Complex calculations in render
    // - Synchronous data processing
    var result = 0.0
    for (_ <- 0 until 50000000) {
      result += Math.sin(Math.random()) * Math.cos(Math.random())
    }

    isBlocking.set(false)
    // Use result to prevent dead code elimination
    dom.console.log(s"Computation result: $result")
  }

  def render(): HtmlElement = {
    div(
      cls("flex flex-col gap-4 p-6 border border-red-300 rounded-lg bg-red-50 max-w-sm"),
      onMountCallback(_ => startAnimation()),
      onUnmountCallback(_ => stopAnimation()),

      div(cls("text-lg font-bold text-red-700"), "🔥 FPS Killer Demo"),
      div(
        cls("text-sm text-gray-600"),
        "Click the button to block the main thread. Watch the spinner stutter and FPS drop!"
      ),

      // Animated spinner that shows FPS issues
      div(
        cls("flex justify-center py-4"),
        div(
          cls("w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full"),
          styleAttr <-- rotation.signal.map(r => s"transform: rotate(${r}deg);")
        )
      ),

      button(
        cls("px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"),
        disabled <-- isBlocking.signal,
        onClick --> Observer { _ => blockMainThread() },
        child.text <-- isBlocking.signal.map(b => if (b) "Blocking..." else "Block Main Thread (50M ops)")
      ),

      div(
        cls("text-xs text-gray-500 mt-2"),
        "💡 The spinner animation uses requestAnimationFrame. When the main thread is blocked, frames are dropped and FPS plummets."
      )
    )
  }
}

