const fs = require('fs').promises
const _ = require('lodash')
const Papa = require('papaparse')
const geodist = require('geodist')
// TODO Change me
const Montpelier = { lat: 44.260059, long: -72.575386 }

async function readFile (input) {
  input = await fs.readFile(input, 'utf8')
  return Papa.parse(input).data.map(x => {
    return {
      locId: x[0],
      countyCode: x[1],
      subnational1Code: x[2],
      subnational2Code: x[3],
      latitude: x[4],
      longitude: x[5],
      name: x[6],
      lastVisited: x[7],
      checklists: x[8]
    }
  })
}

async function run () {
  // TODO Change me
  const hotspots = await readFile('vermont-hotspots.csv')
  // TODO Add way to pipe this in
  let myData = await fs.readFile('MyEbirdData.csv', 'utf8')
  myData = Papa.parse(myData, { header: true })
  // console.log(myData.data)
  const myLocations = [...new Set(myData.data.map(x => x['Location ID']))]
  const targets = hotspots.filter(x => {
    return x.locId !== '' && !myLocations.includes(x.locId)
  }).map(hotspot => {
    const points = { lat: hotspot.latitude, long: hotspot.longitude }
    const dist = geodist(Montpelier, points, { exact: true })
    // console.log(hotspot)
    return {
      name: hotspot.name,
      lastVisited: hotspot.lastVisited,
      checklists: hotspot.checklists,
      distance: dist
    }
  })

  const mostPopular = _.last(_.sortBy(targets, 'checklists').filter(x => x.checklists))
  const emptyHotspots = _.first(_.sortBy(targets.filter(x => !x.checklists), 'distance'))
  // console.log(emptyHotspots)

  // console.log(disjunct.length)
  console.log(`The closest hotspot you haven't visited is ${_.sortBy(targets, 'distance')[0].name}, ${_.sortBy(targets, 'distance')[0].distance.toFixed()} miles away.`)
  console.log(`The oldest least visited hotspot is ${_.sortBy(targets, 'lastVisited')[0].name}, ${_.sortBy(targets, 'lastVisited')[0].distance.toFixed()} miles away, not visited since ${_.sortBy(targets, 'lastVisited')[0].lastVisited.split('-')[0]}.`)
  console.log(`The closest empty hotspot is ${emptyHotspots.name}, ${emptyHotspots.distance.toFixed()} miles away.`)
  console.log(`The most popular hotspot you've somehow missed out on is ${mostPopular.name}, with ${mostPopular.checklists} checklists, ${mostPopular.distance.toFixed()} miles away.`)
  console.log(`You've been to ${((hotspots.length - targets.length) / hotspots.length * 100).toFixed(2)}% of the hotspots in Vermont.`)
  // console.log(`The closest hotspot with no `)
}

run()
