package www

import com.raquo.laminar.api.L.*
import org.scalajs.dom

def MainLaminarApp(): Unit = {
  render(dom.document.getElementById("app"), App()())
}
