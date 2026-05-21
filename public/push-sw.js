/*
 * Web-Push service worker for youth reminders.
 * Registered from the youth portal (/youth). Handles incoming push messages
 * and notification clicks. Kept deliberately tiny — it does not intercept
 * fetches or cache anything.
 */

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = {}
  }

  const title = data.title || 'RCCG Glory Tabernacle'
  const options = {
    body: data.body || '',
    icon: '/logo-with-no-bg.png',
    badge: '/logo-with-no-bg.png',
    tag: data.tag || 'youth-reminder',
    renotify: true,
    data: { url: data.url || '/youth' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = (event.notification.data && event.notification.data.url) || '/youth'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus an existing tab on the target if there is one.
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && 'focus' in client) {
            return client.focus()
          }
        }
        // Otherwise open a new window.
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl)
        }
      })
  )
})
