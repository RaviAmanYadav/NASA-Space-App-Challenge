
package com.astra.health.service;

import com.astra.health.entity.Astronaut;
import com.astra.health.repository.AstronautRepository;

import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class AstronautService {

    private final AstronautRepository astronautRepository;

    public AstronautService(AstronautRepository astronautRepository) {
        this.astronautRepository = astronautRepository;
    }

    public Astronaut saveAstronaut(Astronaut astronaut) {
        return astronautRepository.save(astronaut);
    }

    public List<Astronaut> getAllAstronauts() {
        return astronautRepository.findAll();
    }

    public Astronaut getAstronautById(Long id) {
        return astronautRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Astronaut not found"));
    }

    public void deleteAstronaut(Long id) {
        astronautRepository.deleteById(id);
    }
}
