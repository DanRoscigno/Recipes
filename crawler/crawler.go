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
)

type Recipe struct {
	Name    string
	Content string
	Url     string
}

func main() {
	// Array containing all the known URLs in a sitemap
	knownUrls := []string{}

	c := colly.NewCollector()

	// Create a callback on the XPath query searching for the URLs
	c.OnXML("//urlset/url/loc", func(e *colly.XMLElement) {
		knownUrls = append(knownUrls, e.Text)
	})

	c.SetRequestTimeout(120 * time.Second)
	recipes := make([]Recipe, 0)

	c.OnHTML("article", func(e *colly.HTMLElement) {
		item := Recipe{}
		item.Content = e.Text
		item.Name = e.ChildText("h1")
		item.Url = e.Request.URL.String()
		//item.Url = e. <meta data-rh="true" property="og:url" content="https://danroscigno.github.io/Recipes/brisket/">
		//document.querySelector("meta[property='og:url']").getAttribute('content')
		recipes = append(recipes, item)
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

	c.OnScraped(func(r *colly.Response) {
		//fmt.Println("Finished", r.Request.URL)
		js, err := json.MarshalIndent(recipes, "", "    ")
		if err != nil {
			log.Fatal(err)
		}
		//fmt.Println("Writing data to file")
		if err := os.WriteFile("recipes.json", js, 0664); err == nil {
			fmt.Print(".")
		}

	})

	// Get the sitemap.xml entries
	c.Visit("https://danroscigno.github.io/Recipes/sitemap.xml")

	// Scrape each entry found in the sitemap. The `knownUrls`
	// list is built by the OnXML callback
	for _, url := range knownUrls {
		//fmt.Println("\t", url)
		c.Visit(url)
	}
}
