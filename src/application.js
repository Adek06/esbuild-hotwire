import { Application } from "stimulus"

import HelloController from "./controllers/hello_controller"
// import ClipboardController from "./controllers/clipboard_controller"

const application = Application.start()
application.register("hello", HelloController)
// application.register("clipboard", ClipboardController)