package main


import (
    "encoding/json"
    "log"
    "os"
   "fmt"
   "time"

   "github.com/gocolly/colly"
)

type Recipe struct {
   Name     string
   Content  string
   Url      string
}

func main() {
   c := colly.NewCollector()
   c.SetRequestTimeout(120 * time.Second)
   recipes := make([]Recipe, 0)

    // Callbacks
// looking for 
//  div.theme-doc-markdown.markdown
    // #__docusaurus_skipToContent_fallback > div > div > main > div > div > div.col.docItemCol_VOVn > div > article > div.theme-doc-markdown.markdown > h1
    //c.OnHTML("div.theme-doc-markdown.markdown", func(e *colly.HTMLElement) {
        //item := Recipe{}
        //item.Name = e.Attr("h1")
        //recipes = append(recipes, item)
    //})

   	c.OnHTML("h1", func(e *colly.HTMLElement) {
        item := Recipe{}
        item.Name = e.Text
        recipes = append(recipes, item)
	})

   c.OnRequest(func(r *colly.Request) {
       fmt.Println("Visiting", r.URL)
   })

   c.OnResponse(func(r *colly.Response) {
       fmt.Println("Got a response from", r.Request.URL)
   })

   c.OnError(func(r *colly.Response, e error) {
       fmt.Println("Got this error:", e)
   })

    c.OnScraped(func(r *colly.Response) {
       fmt.Println("Finished", r.Request.URL)
       js, err := json.MarshalIndent(recipes, "", "    ")
       if err != nil {
           log.Fatal(err)
       }
       fmt.Println("Writing data to file")
       if err := os.WriteFile("recipes.json", js, 0664); err == nil {
           fmt.Println("Data written to file successfully")
       }

   })

   c.Visit("https://danroscigno.github.io/Recipes/brisket/")
}

