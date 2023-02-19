# Radio Kizhi

Audioplayer app for those who are traveling to a certain location of historical/cultural significance and want to listen to the lectures/podcasts about the place on the road.

## Features

- This is installable **PWA**.
- Fast loading due to **Stale While Revalidate** cacheing strategy.
- Audiofiles are **downloadable** for offline playback.
- **Download Manager** provides support for download queue, pausing/resuming downloads, progress bar. That is achieved with use of **data streams** and **IndexedDB**.
- **Offline mode**, to which the app switches automatically when needed. Page elements that are associated with lectures which were not downloaded turn B&W.
- **Preserving app state** in localStorage. The last active lecture and all the timecodes are preserved between launches.
- Swipe gesture support.
- Playback controls in push-notification and lock screen with **MediaSession**.




# Радио Кижи

Приложение-плеер для тех, кто едет куда-то *далеко* и хочет послушать про это *далеко* лекции по дороге.

## Фичи

- Это **PWA**&nbsp;&mdash; возможность установить приложение на домашний экран.
- Молниеносная загрузка благодаря стратегии **Stale While Revalidate** на динамическом кэше.
- Возможность скачивать лекции на устройство для прослушивания в оффлайне - с наглядным
  индикатором прогресса закачки, возможностью приостановить закачку и продолжить позже,
  возможностью поставить несколько файлов в очередь на закачку. Всё это потому, что тело ответа
  с файлом аудиозаписи читается ридером как поток данных и сохраняется по кусочкам в **IndexedDB**.
- Оффлайн-режим, в который устройство переходит автоматически при потере связи с интернетом (и обратно).
  В оффлайн-режиме элементы, связанные с нескачанными лекциями, становятся черно-белыми.
- Полное сохранение состояния приложения при выходе из него - сохраняются таймкоды, последняя прослушиваемая
  запись отображается в мини-плеере внизу экрана. Эти данные сохраняются в **localStorage**.
- Поддержка свайп-жестов для манипуляции элементами на экране.
- Управление прослушиванием в **push-уведомлении** и на **lock screen** - с помощью **mediaSession**.

## Команды

- npm run build - собрать проект со сжатием
- npm run dev - собрать проект без сжатия и следить за изменениями

## Вдохновение
[Kino от Google](https://kinoweb.dev/)
