
package com.astra.health.controller;

import com.astra.health.entity.Astronaut;
import com.astra.health.service.AstronautService;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/astronauts")
public class AstronautController {

    private final AstronautService astronautService;

    public AstronautController(AstronautService astronautService) {
        this.astronautService = astronautService;
    }

    @PostMapping
    public Astronaut createAstronaut(@RequestBody Astronaut astronaut) {
        return astronautService.saveAstronaut(astronaut);
    }

    @GetMapping
    public List<Astronaut> getAllAstronauts() {
        return astronautService.getAllAstronauts();
    }

    @GetMapping("/{id}")
    public Astronaut getAstronautById(@PathVariable Long id) {
        return astronautService.getAstronautById(id);
    }

    @DeleteMapping("/{id}")
    public void deleteAstronaut(@PathVariable Long id) {
        astronautService.deleteAstronaut(id);
    }
}
