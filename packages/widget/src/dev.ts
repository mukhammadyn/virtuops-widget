// Dev-only entry — initialises the widget against a mock or real token
import './web-component/index'

const el = document.createElement('virtuops-chat')
el.setAttribute('token', 'demo-token')
// el.setAttribute('api-url', 'http://localhost:3000')
document.body.appendChild(el)
