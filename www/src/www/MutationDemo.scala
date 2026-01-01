package www

import com.raquo.laminar.api.L.*
import base.LaminarComponent
import org.scalajs.dom

/** Demo component that triggers all types of mutations observable by
  * MutationObserver.
  *
  * MutationObserver can observe:
  *   1. childList - Adding/removing child nodes 2. attributes - Changes to
  *      element attributes (class, style, data-*, id, etc.) 3. characterData -
  *      Changes to text content in text nodes
  *
  * Turn on the MutationScanner and click the buttons to see highlights!
  */
case class MutationDemo() extends LaminarComponent {
  // State for childList mutations
  private val items = Var(List("Item 1", "Item 2", "Item 3"))
  private val itemCounter = Var(3)

  // State for attribute mutations
  private val colorIndex = Var(0)
  private val sizeIndex = Var(0)
  private val customData = Var(0)

  // State for characterData mutations
  private val textContent = Var("Hello, World!")
  private val counter = Var(0)

  // State for combined mutations
  private val isAnimating = Var(false)
  private var animationId: Int = 0

  private val colors = Vector(
    "bg-blue-200",
    "bg-green-200",
    "bg-yellow-200",
    "bg-red-200",
    "bg-purple-200",
    "bg-pink-200"
  )
  private val sizes =
    Vector("text-sm", "text-base", "text-lg", "text-xl", "text-2xl")

  private def startRapidMutations(): Unit = {
    isAnimating.set(true)
    var count = 0
    def loop(): Unit = {
      count += 1
      // Trigger multiple types of mutations each frame
      colorIndex.update(i => (i + 1) % colors.length)
      counter.update(_ + 1)
      if (count % 10 == 0) {
        items.update(list => list :+ s"Auto-${count / 10}")
      }
      if (count < 100) {
        animationId = dom.window.requestAnimationFrame(_ => loop())
      } else {
        isAnimating.set(false)
      }
    }
    loop()
  }

  private def stopRapidMutations(): Unit = {
    dom.window.cancelAnimationFrame(animationId)
    isAnimating.set(false)
  }

  def render(): HtmlElement = {
    div(
      cls(
        "flex flex-col gap-6 p-6 border border-blue-300 rounded-lg bg-blue-50 max-w-2xl"
      ),
      onUnmountCallback(_ => stopRapidMutations()),

      // Header
      div(
        cls("text-lg font-bold text-blue-700"),
        "🔬 Mutation Observer Demo"
      ),
      div(
        cls("text-sm text-gray-600"),
        "Turn on MutationScanner and click buttons to see different mutation types highlighted!"
      ),

      // Three columns for different mutation types
      div(
        cls("grid grid-cols-1 md:grid-cols-3 gap-4"),

        // Column 1: childList mutations
        div(
          cls("p-4 bg-white rounded border border-gray-200"),
          div(
            cls("font-semibold text-gray-700 mb-2"),
            "📦 childList Mutations"
          ),
          div(cls("text-xs text-gray-500 mb-3"), "Adding/removing DOM nodes"),

          // Dynamic list
          div(
            cls("min-h-24 mb-3 space-y-1"),
            children <-- items.signal.map(
              _.map(item =>
                div(cls("px-2 py-1 bg-gray-100 rounded text-sm"), item)
              )
            )
          ),

          // Buttons
          div(
            cls("flex gap-2"),
            button(
              cls(
                "flex-1 px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
              ),
              onClick --> Observer { _ =>
                itemCounter.update(_ + 1)
                items.update(list => list :+ s"Item ${itemCounter.now()}")
              },
              "+ Add"
            ),
            button(
              cls(
                "flex-1 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
              ),
              onClick --> Observer { _ =>
                items.update(list => if (list.nonEmpty) list.init else list)
              },
              "- Remove"
            ),
            button(
              cls(
                "flex-1 px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
              ),
              onClick --> Observer { _ =>
                itemCounter.set(3)
                items.set(List("Item 1", "Item 2", "Item 3"))
              },
              "Reset"
            )
          )
        ),

        // Column 2: attributes mutations
        div(
          cls("p-4 bg-white rounded border border-gray-200"),
          div(
            cls("font-semibold text-gray-700 mb-2"),
            "🎨 attributes Mutations"
          ),
          div(
            cls("text-xs text-gray-500 mb-3"),
            "Changing class, style, data-*"
          ),

          // Element with changing attributes
          div(
            cls("min-h-24 mb-3 flex items-center justify-center"),
            div(
              cls <-- Signal.combine(colorIndex.signal, sizeIndex.signal).map {
                case (ci, si) =>
                  s"p-4 rounded transition-all ${colors(ci)} ${sizes(si)}"
              },
              dataAttr("custom") <-- customData.signal.map(_.toString),
              "Watch me change!"
            )
          ),

          // Buttons
          div(
            cls("flex flex-col gap-2"),
            button(
              cls(
                "px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
              ),
              onClick --> Observer { _ =>
                colorIndex.update(i => (i + 1) % colors.length)
              },
              "Change Color (class)"
            ),
            button(
              cls(
                "px-2 py-1 bg-indigo-500 text-white text-xs rounded hover:bg-indigo-600"
              ),
              onClick --> Observer { _ =>
                sizeIndex.update(i => (i + 1) % sizes.length)
              },
              "Change Size (class)"
            ),
            button(
              cls(
                "px-2 py-1 bg-teal-500 text-white text-xs rounded hover:bg-teal-600"
              ),
              onClick --> Observer { _ =>
                customData.update(_ + 1)
              },
              "Change data-* attr"
            )
          )
        ),

        // Column 3: characterData mutations
        div(
          cls("p-4 bg-white rounded border border-gray-200"),
          div(
            cls("font-semibold text-gray-700 mb-2"),
            "📝 characterData Mutations"
          ),
          div(cls("text-xs text-gray-500 mb-3"), "Changing text node content"),

          // Dynamic text content
          div(
            cls(
              "min-h-24 mb-3 flex flex-col items-center justify-center gap-2"
            ),
            div(
              cls("text-lg font-medium text-gray-800"),
              child.text <-- textContent.signal
            ),
            div(
              cls("text-3xl font-bold text-blue-600"),
              child.text <-- counter.signal.map(c => s"Count: $c")
            )
          ),

          // Buttons
          div(
            cls("flex flex-col gap-2"),
            button(
              cls(
                "px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600"
              ),
              onClick --> Observer { _ =>
                val messages = Vector(
                  "Hello, World!",
                  "Mutation detected!",
                  "Text changed!",
                  "Observer active!",
                  "DOM updated!"
                )
                textContent.update(t =>
                  messages((messages.indexOf(t) + 1) % messages.length)
                )
              },
              "Change Text"
            ),
            button(
              cls(
                "px-2 py-1 bg-cyan-500 text-white text-xs rounded hover:bg-cyan-600"
              ),
              onClick --> Observer { _ =>
                counter.update(_ + 1)
              },
              "Increment Counter"
            ),
            button(
              cls(
                "px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
              ),
              onClick --> Observer { _ =>
                textContent.set("Hello, World!")
                counter.set(0)
              },
              "Reset"
            )
          )
        )
      ),

      // Rapid mutations section
      div(
        cls("p-4 bg-white rounded border border-orange-200 mt-2"),
        div(
          cls("font-semibold text-orange-700 mb-2"),
          "⚡ Rapid Mutations (All Types)"
        ),
        div(
          cls("text-xs text-gray-500 mb-3"),
          "Trigger 100 frames of combined mutations to stress-test the scanner"
        ),
        div(
          cls("flex gap-2"),
          button(
            cls(
              "px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
            ),
            disabled <-- isAnimating.signal,
            onClick --> Observer { _ => startRapidMutations() },
            child.text <-- isAnimating.signal.map(a =>
              if (a) "Running..." else "Start Rapid Mutations"
            )
          ),
          button(
            cls("px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"),
            onClick --> Observer { _ =>
              stopRapidMutations()
              colorIndex.set(0)
              sizeIndex.set(0)
              customData.set(0)
              counter.set(0)
              itemCounter.set(3)
              items.set(List("Item 1", "Item 2", "Item 3"))
              textContent.set("Hello, World!")
            },
            "Reset All"
          )
        )
      ),

      // Info box
      div(
        cls("text-xs text-gray-500 mt-2 p-3 bg-gray-100 rounded"),
        "💡 ",
        span(cls("font-semibold"), "MutationObserver options used: "),
        "childList, attributes, attributeOldValue, characterData, characterDataOldValue, subtree"
      )
    )
  }
}
