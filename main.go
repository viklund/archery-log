package main

import (
    "net/http"
    "fmt"

    "github.com/gin-gonic/gin"
)

type hit struct {
    X     float64 `json:"X"`
    Y     float64 `json:"Y"`
    Angle float64 `json:"Angle"`
    Dist  float64 `json:"Dist"`
    Score int32   `json:"Score"`
}

var hits = []hit{}

func getHits(c *gin.Context) {
    c.IndentedJSON(http.StatusOK, hits);
}

func addHit(c *gin.Context) {
    var newHit hit

    fmt.Println("Hej")

    if err := c.BindJSON(&newHit); err != nil {
        return
    }

    hits = append(hits, newHit)
    c.IndentedJSON(http.StatusCreated, newHit)
}

func main() {
    router := gin.Default()
    router.GET("/api/getHits", getHits)
    router.POST("/api/addHit", addHit)

    router.Run("localhost:8081")
}
