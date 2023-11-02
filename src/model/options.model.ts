export interface Options {
  stamp?: string // defaults to getUsableStamp()
  identifier?: string // defaults to getIdentifierFromUrl(window.location.href)
  beeApiUrl?: string // defaults to http://localhost:1633
  beeDebugApiUrl?: string // defaults to http://localhost:1635
}
