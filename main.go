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

var db *sql.DB

func getHits(c *gin.Context) {
    fmt.Printf("%v\n", db)
    rows, err := db.Query("SELECT * from hits");
    checkErr(err)

    var hits = []hit{}

    for rows.Next() {
        var h hit
        err = rows.Scan(&h.Id, &h.X, &h.Y, &h.Angle, &h.Dist, &h.Score)
        checkErr(err)

        hits = append(hits, h)
    }

    c.IndentedJSON(http.StatusOK, hits);
}

func addHit(c *gin.Context) {
    var newHit hit

    if err := c.BindJSON(&newHit); err != nil {
        return
    }

    stmt, err := db.Prepare("INSERT INTO hits(x,y,angle,dist,score) VALUES (?,?,?,?,?)")
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
    router.GET("/api/hits", getHits)
    router.POST("/api/hits", addHit)
    // https://gin-gonic.com/docs/examples/bind-uri/
    // router.GET"("/api/hits/:hit", getHit)

    // I guess the URI structure should be /api/sessions/:session/hits/:hit
    // POST /api/sessions   - create session
    // GET  /api/sessions   - get all sessions
    // GET  /api/essions/1  - get first session
    // POST /api/sessions/1/hits   - create hit
    // GET  /api/sessions/1/hits   - get all hits for session
    // GET  /api/sessions/1/hits/1 - get first hit for session

    router.Run("0.0.0.0:8081")
}

func checkErr(err error) {
    if err != nil {
        panic(err)
    }
}
