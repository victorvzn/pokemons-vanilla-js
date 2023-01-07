const POKEMONS_STORAGE_KEY = 'pokemon-favorites'

let pokemonFavorites = JSON.parse(localStorage.getItem(POKEMONS_STORAGE_KEY)) ?? []

let page = 1
let pages = 0

const fetchPokemons = async (page = 1) => {
  const limit = 9
	const offset = (page - 1) * limit
	const API_URL = `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`
  
  const { data } = await axios.get(API_URL)
  const dataResults = data.results.map(pokemon => {
		// "url": "https://pokeapi.co/api/v2/pokemon/1/"
		const id = pokemon.url.split('/').at(6) // [6]
    const currentFavorites = JSON.parse(localStorage.getItem(POKEMONS_STORAGE_KEY)) ?? []
    const isFavorite = currentFavorites.find(favorite => favorite.id === id)
		let image = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
		return {
			...pokemon, // name, url
      id,
			name: !!isFavorite ? isFavorite.name : pokemon.name,
      image: !!isFavorite ? isFavorite.image : image,
      isFavorite: !!isFavorite
		}
	})
  // console.log(dataResults)
  pages = Math.ceil(data.count / limit)
  return dataResults
}

const getPokemon = async (id) => {
  const response = await fetch (`https://pokeapi.co/api/v2/pokemon/${id}`)
  const data = await response.json()
  return data
}

const renderPokemons = async (pokemons) => {
  const pokemonsList = document.getElementById('pokemonsList')

  let elements = ''

  pokemons.forEach(({ id, name, image, isFavorite }) => {
    elements += `
      <article class="pokemons-item">
        <img src="${image}" width="80" height="80" loading="lazy" alt="${name}" />
        <h6>#${id}</h6>
        <h4>${name}</h4>
        <div class="pokemon__buttons">
          <button onclick="viewPokemon(${id})" class="btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" class="feather feather-eye" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button onclick="toggleFavorite('${id}', '${name}')" class="btn">
            <svg class="feather feather-star ${isFavorite ? 'is-favorite' : ''}" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </button>
          <button onclick="readPokemon(${id})" class="btn ${!isFavorite ? 'is-hidden' : ''}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" class="feather feather-edit" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </div>
      </article>
    `
  })

  pokemonsList.innerHTML = elements
}

const toggleFavorite = async (id, name) => {
  const foundPokemonFavorite = pokemonFavorites.filter(favorite => favorite.id === id)
  const existPokemonFavorite = foundPokemonFavorite.length > 0

  if (existPokemonFavorite) {
    pokemonFavorites = pokemonFavorites.filter(favorite => favorite.id !== id)
  } else {
    let image = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
    pokemonFavorites.push({ id, name, image })
  }

  localStorage.setItem(POKEMONS_STORAGE_KEY, JSON.stringify(pokemonFavorites))

  const pokemons = await fetchPokemons(page);
  renderPokemons(pokemons);
  currentPage.innerHTML = page;
}

const readPokemon = async (pokemonId) => {
  const pokemonForm = document.forms['pokemonForm'];

  const foundPokemon = pokemonFavorites.find(favorite => Number(favorite.id) === pokemonId)

  const { id, name, image } = foundPokemon;

  pokemonForm.id.value = id;
  pokemonForm.name.value = name;
  pokemonForm.image.value = image;
}

const updatePokemon = async () => {
  const pokemonForm = document.forms['pokemonForm'];

  const id = pokemonForm.id.value;
  const name = pokemonForm.name.value;
  const image = pokemonForm.image.value;

  const newPokemons = pokemonFavorites.map(pokemon => {
    if (pokemon.id === id) {
      return { id, name, image }
    }
    return pokemon
  })

  localStorage.setItem(POKEMONS_STORAGE_KEY, JSON.stringify(newPokemons))

  pokemonForm.reset()

  const pokemons = await fetchPokemons(page);
  renderPokemons(pokemons);
  currentPage.innerHTML = page;
}

const viewPokemon = async (pokemonId) => {
  const data = await getPokemon(pokemonId);
  const image = data.sprites.other['official-artwork'].front_default
  const types = await data.types.map(type => type.type.name).join(', ')
  Swal.fire({
    html: `
      <div style="display:flex;align-items:center;flex-direction:column;">
        <h1 style="text-transform:uppercase;text-align:center;">${data.name}</h1>
        <img src="${image}" width="300" height="300" />
        <div><strong>Power:</strong> ${types}</div>
      </div>
    `,
    showCloseButton: false,
    showCancelButton: false,
    focusConfirm: false,
  })
}

const documentReady = async () => {
  const nextPage = document.getElementById('nextPage')
  const prevPage= document.getElementById('prevPage')
  const firstPage= document.getElementById('firstPage')
  const lastPage= document.getElementById('lastPage')
  const currentPage = document.getElementById('currentPage')

	nextPage.addEventListener('click', async () => {
    // page = page + 1
    const pokemons = await fetchPokemons(++page)

    if (page >= pages ) return

    renderPokemons(pokemons)
    currentPage.innerHTML = page
  })

	prevPage.addEventListener('click', async () => {
    if (page === 1) return

    // page = page - 1
    const pokemons = await fetchPokemons(--page)
    renderPokemons(pokemons)
    currentPage.innerHTML = page
  })

  firstPage.addEventListener('click', async () => {
    const pokemons = await fetchPokemons(1)
    renderPokemons(pokemons)
    page = 1
    currentPage.innerHTML = 1
  })

  lastPage.addEventListener('click', async () => {
    const pokemons = await fetchPokemons(pages)
    renderPokemons(pokemons)
    page = pages
    currentPage.innerHTML = pages
  })

  const pokemonForm = document.getElementById('pokemonForm')

  const handleSubmit = (e) => {
    e.preventDefault();
    updatePokemon()
  }

  pokemonForm.addEventListener('submit', handleSubmit)

  const pokemons = await fetchPokemons()
  renderPokemons(pokemons)
  currentPage.innerHTML = page;
}


document.addEventListener('DOMContentLoaded', documentReady)

