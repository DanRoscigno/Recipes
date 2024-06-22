package main

// This crawler is not a general purpose Docusaurus
// crawler. It is only appropriate for pages where
// all of the text is meant to be in a single record.
//
// I want the Algolia index that is built from my
// recipes site to have one record per page and that
// record to have only four items:
// - the name of the recipe
// - the URL of the page
// - the Algolia object ID
// - all of the text (ingredients, instructions, etc.)

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/gocolly/colly/v2"

	"github.com/algolia/algoliasearch-client-go/algoliasearch"
	"github.com/joho/godotenv"
)

// This struct includes all of the information needed in the Algolia
// records (TO DO: Add an Algolia Object ID field)
type Recipe struct {
	lvl0    string
	content string
	url     string
}

func main() {

	// read in Algolia details
	godotenv.Load()
	algoliaCliAppId, envSet := os.LookupEnv("ALGOLIA_APP_ID")
	algoliaCliApiKey, envSet := os.LookupEnv("ALGOLIA_API_KEY")

	if !envSet {
		log.Fatal("Please set the ALGOLIA_APP_ID and ALGOLIA_API_KEY environment variables")
	}

	searchClient := algoliasearch.NewClient(algoliaCliAppId, algoliaCliApiKey)
	searchIndex := searchClient.InitIndex("recipes_crawled_golang")

	// Create an array of Recipes
	recipes := make([]Recipe, 0)

	// Array containing all the known URLs in a sitemap.
	// The callback function `OnXML` will be triggered for each line
	// read when the c.Visit runs against an XML file. The sitemaps.xml
	// file gets read when `c.Visit` gets called with the sitempa URL
	// as the argument.
	knownUrls := []string{}

	c := colly.NewCollector()

	// Create a callback on the XPath query searching for the URLs
	// This is the format of the sitemap.xml:
	// <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
	// <url>
	// <loc>https://danroscigno.github.io/Recipes/1-2-3_Blackberry_Sherbet/</loc>
	// <changefreq>weekly</changefreq>
	// <priority>0.5</priority>
	// </url>

	// Looking at the format above, the URL for each recipe is in urlset > url > loc
	c.OnXML("//urlset/url/loc", func(e *colly.XMLElement) {
		knownUrls = append(knownUrls, e.Text)
	})

	c.SetRequestTimeout(120 * time.Second)

	// every recipe is contained inside an HTML `<article>` tag.
	// - create a Recipe struct named `item`
	// - assign the text of the article to `item.content`
	// - assign the text from the first h1 (there can only be one h1 if we follow the rules) to `item.lvl0`
	// - assign the URL being scraped to item.url
	// - append the struct to the Recipes array
	c.OnHTML("article", func(e *colly.HTMLElement) {
		item := Recipe{}
		item.content = e.Text
		item.lvl0 = e.ChildText("h1")
		item.url = e.Request.URL.String()
		recipes = append(recipes, item)

		algoliaObject := make(algoliasearch.Object)
		algoliaObject["objectID"] = item.url
		algoliaObject["content"] = item.content
		algoliaObject["lvl0"] = item.lvl0

		searchIndex.AddObject(algoliaObject)
	})

	//c.OnRequest(func(r *colly.Request) {
	//fmt.Println("Visiting", r.URL)
	//})

	//c.OnResponse(func(r *colly.Response) {
	//fmt.Println("Got a response from", r.Request.URL)
	//})

	c.OnError(func(r *colly.Response, e error) {
		fmt.Println("Got this error:", e)
	})

	// OnScraped is a callback function that runs after a page
	// is scraped. This just prints a dot
	c.OnScraped(func(r *colly.Response) {
		fmt.Print(".")
	})

	// Get the sitemap.xml entries
	c.Visit("https://danroscigno.github.io/Recipes/sitemap.xml")

	// Scrape each entry found in the sitemap. The `knownUrls`
	// list is built by the OnXML callback

	// NOTE: temporarily commenting out to avoid a huge Algolia expense while experimenting
	//for _, url := range knownUrls {
	//c.Visit(url)
	//}

	// Visit only two URLs
	c.Visit(knownUrls[2])
	c.Visit(knownUrls[20])

	js, err := json.MarshalIndent(recipes, "", "    ")
	if err != nil {
		log.Fatal(err)
	}
	//fmt.Println("Writing data to file")
	if err := os.WriteFile("recipes.json", js, 0664); err != nil {
		log.Fatal(err)
	}
}
