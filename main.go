package main

import (
    "database/sql"
    "net/http"
    "fmt"

    "github.com/gin-gonic/gin"
    _ "github.com/mattn/go-sqlite3"
)

type hit struct {
    Id    int64   `json:"id,omitempty"`
    X     float64 `json:"X,omitempty"`
    Y     float64 `json:"Y,omitempty"`
    Angle float64 `json:"Angle,omitempty"`
    Dist  float64 `json:"Dist,omitempty"`
    Score int32   `json:"Score,omitempty"`
}

var hits = []hit{}
var db *sql.DB

func getHits(c *gin.Context) {
    fmt.Printf("%v\n", db)
    c.IndentedJSON(http.StatusOK, hits);
}

func addHit(c *gin.Context) {
    var newHit hit

    if err := c.BindJSON(&newHit); err != nil {
        return
    }

    stmt, err := db.Prepare("INSERT INTO hit(x,y,angle,dist,score) VALUES (?,?,?,?,?)")
    checkErr(err)

    res, err := stmt.Exec(newHit.X, newHit.Y, newHit.Angle, newHit.Dist, newHit.Score)
    checkErr(err)

    id, err := res.LastInsertId()
    checkErr(err)

    fmt.Println(id)
    newHit.Id = id

    c.IndentedJSON(http.StatusCreated, newHit)
}

func main() {
    var err error
    db, err = sql.Open("sqlite3", "./database.db")
    if err != nil {
        fmt.Println("Error with database: ", err)
    }
    fmt.Printf("%v\n", db)

    router := gin.Default()
    router.GET("/api/getHits", getHits)
    router.POST("/api/addHit", addHit)

    router.Run("0.0.0.0:8081")
}

func checkErr(err error) {
    if err != nil {
        panic(err)
    }
}
