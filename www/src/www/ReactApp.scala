package www

import japgolly.scalajs.react.*
import japgolly.scalajs.react.vdom.html_<^.*
import org.scalajs.dom.document
import japgolly.scalajs.react.hooks.Hooks.UseState

case class ReactApp():
  def apply(): VdomElement =
    ReactApp.Component()

object ReactApp:
  type Props = ReactApp

  val useTitleCounter: HookResult[UseState[Int]] =
    for
      count <- useState(0)
      _ <- useEffect(Callback {
        document.title = s"You clicked ${count.value} times"
      })
    yield count

  val ReusableRender = React.memo(
    ScalaFnComponent[(UseState[Int], UseState[String])] { case (count, fruit) =>
      // This will only print when the component actually re-renders
      println(
        s"ReusableRender rendering: count=${count.value}, fruit=${fruit.value}"
      )
      <.div(
        <.p(s"You clicked ${count.value} times"),
        <.button(
          ^.onClick --> count.modState(_ + 1),
          "Click me"
        ),
        <.p(s"Your favourite fruit is a ${fruit.value}!")
      )
    }
  )

  val Component = ScalaFnComponent[Unit](_ =>
    for {
      count <- useState(0)
      fruit <- useState("banana")
      unrelated <- useState(0) // This state doesn't pass to ReusableRender
      _ <- useEffect(Callback {
        document.title = s"You clicked ${count.value} times"
      })
    } yield <.div(
      ReusableRender(count, fruit),
      <.button(
        ^.onClick --> unrelated.modState(_ + 1),
        s"Unrelated clicks: ${unrelated.value}"
      )
    )
  )

  val HelloComponent = ScalaFnComponent[Unit]: _ =>
    for
      count <- useTitleCounter // <--- usage
      fruit <- useState("banana")
    yield <.div(
      <.p(s"You clicked ${count.value} times"),
      <.button(
        ^.onClick --> count.modState(_ + 1),
        "Click me"
      ),
      <.p(s"Your favourite fruit is a ${fruit.value}!")
    )
